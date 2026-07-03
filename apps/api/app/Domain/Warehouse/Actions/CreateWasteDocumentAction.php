<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Actions;

use App\Domain\Inventory\Enums\StockMovementReason;
use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\StockMovement;
use App\Domain\Warehouse\Enums\WasteReason;
use App\Domain\Warehouse\Enums\WasteStatus;
use App\Domain\Warehouse\Models\Warehouse;
use App\Domain\Warehouse\Models\WasteDocument;
use App\Domain\Warehouse\Models\WasteDocumentItem;
use App\Domain\Warehouse\Support\DocumentNumberGenerator;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Creates a waste/write-off document (Tovarlarning chiqindilari) along with
 * line items, and atomically:
 *   - records a `waste` StockMovement per ingredient
 *   - DECREMENTS `ingredient.current_stock`
 *   - computes total_cost from items
 *
 * doc_no auto-generates as `WST-YYMMDD-NNNN`.
 */
class CreateWasteDocumentAction
{
    /**
     * @param array{
     *   tenant_id?: string|null,
     *   warehouse_id: string,
     *   doc_date?: string|\DateTimeInterface|null,
     *   reason: string,
     *   status?: string,
     *   notes?: string|null,
     *   created_by?: int|null,
     *   items: array<int, array{
     *     ingredient_id: string,
     *     quantity: float|int|string,
     *     unit_cost?: int|null,
     *     notes?: string|null,
     *   }>,
     * } $input
     */
    public function __invoke(array $input): WasteDocument
    {
        if (empty($input['items'])) {
            throw ValidationException::withMessages([
                'items' => ['Hujjat hech bo\'lmaganda 1 ta band bo\'lishi kerak.'],
            ]);
        }

        $reason = WasteReason::tryFrom((string) $input['reason']);
        if ($reason === null) {
            throw ValidationException::withMessages([
                'reason' => ['Noto\'g\'ri yo\'qotish sababi.'],
            ]);
        }

        return DB::transaction(function () use ($input, $reason): WasteDocument {
            /** @var Warehouse $warehouse */
            $warehouse = Warehouse::query()->findOrFail($input['warehouse_id']);

            $tenantId = $input['tenant_id'] ?? $warehouse->tenant_id;

            $docDate = isset($input['doc_date'])
                ? Carbon::parse($input['doc_date'])
                : now();

            $status = WasteStatus::tryFrom((string) ($input['status'] ?? WasteStatus::Posted->value))
                ?? WasteStatus::Posted;

            $docNo = DocumentNumberGenerator::generate(
                WasteDocument::class,
                'WST',
                $tenantId,
                $docDate,
            );

            $totalCost = 0;
            $itemRows = [];
            foreach ($input['items'] as $row) {
                $qty = (float) $row['quantity'];
                if ($qty <= 0) {
                    throw ValidationException::withMessages([
                        'items' => ['Har bir bandning miqdori 0 dan katta bo\'lishi kerak.'],
                    ]);
                }

                // Fallback to ingredient cost_per_unit if caller didn't pass one.
                $unitCost = isset($row['unit_cost'])
                    ? (int) $row['unit_cost']
                    : (int) (Ingredient::query()->whereKey($row['ingredient_id'])->value('cost_per_unit') ?? 0);

                $lineTotal = (int) round($qty * $unitCost);
                $totalCost += $lineTotal;

                $itemRows[] = [
                    'ingredient_id' => $row['ingredient_id'],
                    'quantity' => $qty,
                    'unit_cost' => $unitCost,
                    'total_cost' => $lineTotal,
                    'notes' => $row['notes'] ?? null,
                ];
            }

            /** @var WasteDocument $document */
            $document = WasteDocument::create([
                'tenant_id' => $tenantId,
                'warehouse_id' => $warehouse->id,
                'doc_no' => $docNo,
                'doc_date' => $docDate->toDateString(),
                'reason' => $reason->value,
                'total_cost' => $totalCost,
                'status' => $status->value,
                'notes' => $input['notes'] ?? null,
                'created_by' => $input['created_by'] ?? null,
            ]);

            // stock_movements.created_by stores the user *uuid*, not the
            // bigint users.id that documents keep — resolve it once.
            $creatorUuid = $status === WasteStatus::Posted
                ? $this->creatorUuid($input['created_by'] ?? null)
                : null;

            foreach ($itemRows as $row) {
                WasteDocumentItem::create([
                    'waste_document_id' => $document->id,
                    'ingredient_id' => $row['ingredient_id'],
                    'quantity' => $row['quantity'],
                    'unit_cost' => $row['unit_cost'],
                    'total_cost' => $row['total_cost'],
                    'notes' => $row['notes'],
                ]);

                if ($status === WasteStatus::Posted) {
                    $this->applyStockWriteOff(
                        $row['ingredient_id'],
                        (float) $row['quantity'],
                        (int) $row['unit_cost'],
                        $document,
                        $creatorUuid,
                    );
                }
            }

            $reloaded = $document->fresh(['items', 'warehouse']);
            assert($reloaded instanceof WasteDocument);

            return $reloaded;
        });
    }

    private function applyStockWriteOff(
        string $ingredientId,
        float $quantity,
        int $unitCost,
        WasteDocument $document,
        ?string $creatorUuid,
    ): void {
        /** @var Ingredient $ingredient */
        $ingredient = Ingredient::query()
            ->lockForUpdate()
            ->findOrFail($ingredientId);

        $previousBalance = (float) $ingredient->current_stock;

        // Guard: refuse to write off more than is on hand. Negative stock
        // corrupts reports and audit reconciliation downstream.
        if ($quantity > $previousBalance) {
            $name = is_array($ingredient->name) ? ($ingredient->name['uz'] ?? reset($ingredient->name)) : (string) $ingredient->name;
            throw ValidationException::withMessages([
                'items' => [
                    "Yetarli qoldiq yo'q: \"{$name}\" — joriy qoldiq {$previousBalance}, so'ralgan {$quantity}.",
                ],
            ]);
        }

        $newBalance = $previousBalance - $quantity;

        $ingredient->update(['current_stock' => $newBalance]);

        StockMovement::create([
            'tenant_id' => $document->tenant_id,
            'ingredient_id' => $ingredient->id,
            'delta' => -$quantity,
            'balance_after' => $newBalance,
            'reason' => StockMovementReason::Waste->value,
            'reference_type' => 'waste_document',
            'reference_id' => $document->id,
            'cost_per_unit' => $unitCost > 0 ? $unitCost : null,
            'notes' => "Yo'qotish: {$document->doc_no}",
            'recorded_at' => now(),
            'created_by' => $creatorUuid,
            'created_at' => now(),
        ]);
    }

    /**
     * stock_movements.created_by is a uuid column pointing at users.uuid,
     * while warehouse documents keep the bigint users.id. MySQL's CHAR(36)
     * silently accepted a stringified bigint here; PostgreSQL's uuid type
     * rejects it — look the uuid up explicitly.
     */
    private function creatorUuid(?int $userId): ?string
    {
        return $userId === null
            ? null
            : User::query()->whereKey($userId)->value('uuid');
    }
}
