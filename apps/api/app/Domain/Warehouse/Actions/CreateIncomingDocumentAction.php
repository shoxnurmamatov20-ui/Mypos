<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Actions;

use App\Domain\Inventory\Enums\StockMovementReason;
use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\StockMovement;
use App\Domain\Warehouse\Enums\IncomingStatus;
use App\Domain\Warehouse\Models\IncomingDocument;
use App\Domain\Warehouse\Models\IncomingDocumentItem;
use App\Domain\Warehouse\Models\Warehouse;
use App\Domain\Warehouse\Support\DocumentNumberGenerator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Creates an incoming-goods document (Tovarlar kelib tushishi) along with its
 * line items, and atomically:
 *   - records a `receipt` StockMovement per ingredient
 *   - increments `ingredient.current_stock`
 *   - computes total_amount from items
 *
 * doc_no auto-generates as `IN-YYMMDD-NNNN`. The whole pipeline runs inside
 * a single DB transaction so a partial failure (e.g. a missing ingredient)
 * leaves no orphaned rows behind.
 */
class CreateIncomingDocumentAction
{
    /**
     * @param array{
     *   tenant_id?: string|null,
     *   warehouse_id: string,
     *   doc_date?: string|\DateTimeInterface|null,
     *   supplier_name?: string|null,
     *   supplier_inn?: string|null,
     *   currency?: string,
     *   status?: string,
     *   notes?: string|null,
     *   created_by?: int|null,
     *   items: array<int, array{
     *     ingredient_id: string,
     *     quantity: float|int|string,
     *     unit_price?: int,
     *     expiry_date?: string|\DateTimeInterface|null,
     *     batch_number?: string|null,
     *     notes?: string|null,
     *   }>,
     * } $input
     */
    public function __invoke(array $input): IncomingDocument
    {
        if (empty($input['items'])) {
            throw ValidationException::withMessages([
                'items' => ['Hujjat hech bo\'lmaganda 1 ta band bo\'lishi kerak.'],
            ]);
        }

        return DB::transaction(function () use ($input): IncomingDocument {
            /** @var Warehouse $warehouse */
            $warehouse = Warehouse::query()->findOrFail($input['warehouse_id']);

            $tenantId = $input['tenant_id'] ?? $warehouse->tenant_id;

            $docDate = isset($input['doc_date'])
                ? Carbon::parse($input['doc_date'])
                : now();

            $status = IncomingStatus::tryFrom((string) ($input['status'] ?? IncomingStatus::Posted->value))
                ?? IncomingStatus::Posted;

            $docNo = DocumentNumberGenerator::generate(
                IncomingDocument::class,
                'IN',
                $tenantId,
                $docDate,
            );

            // Calculate items totals up-front; we need total_amount for the
            // header insert anyway.
            $totalAmount = 0;
            $itemRows = [];
            foreach ($input['items'] as $row) {
                $qty = (float) $row['quantity'];
                if ($qty <= 0) {
                    throw ValidationException::withMessages([
                        'items' => ['Har bir bandning miqdori 0 dan katta bo\'lishi kerak.'],
                    ]);
                }
                $unitPrice = (int) ($row['unit_price'] ?? 0);
                $lineTotal = (int) round($qty * $unitPrice);
                $totalAmount += $lineTotal;

                $itemRows[] = [
                    'ingredient_id' => $row['ingredient_id'],
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'total_price' => $lineTotal,
                    'expiry_date' => isset($row['expiry_date']) ? Carbon::parse($row['expiry_date'])->toDateString() : null,
                    'batch_number' => $row['batch_number'] ?? null,
                    'notes' => $row['notes'] ?? null,
                ];
            }

            /** @var IncomingDocument $document */
            $document = IncomingDocument::create([
                'tenant_id' => $tenantId,
                'warehouse_id' => $warehouse->id,
                'doc_no' => $docNo,
                'doc_date' => $docDate->toDateString(),
                'supplier_name' => $input['supplier_name'] ?? null,
                'supplier_inn' => $input['supplier_inn'] ?? null,
                'total_amount' => $totalAmount,
                'currency' => $input['currency'] ?? 'UZS',
                'status' => $status->value,
                'notes' => $input['notes'] ?? null,
                'created_by' => $input['created_by'] ?? null,
            ]);

            foreach ($itemRows as $row) {
                IncomingDocumentItem::create([
                    'incoming_document_id' => $document->id,
                    'ingredient_id' => $row['ingredient_id'],
                    'quantity' => $row['quantity'],
                    'unit_price' => $row['unit_price'],
                    'total_price' => $row['total_price'],
                    'expiry_date' => $row['expiry_date'],
                    'batch_number' => $row['batch_number'],
                    'notes' => $row['notes'],
                ]);

                // Only `posted` documents actually move stock. `draft` lets
                // managers prepare an arrival without committing to it.
                if ($status === IncomingStatus::Posted) {
                    $this->applyStockReceipt(
                        $row['ingredient_id'],
                        (float) $row['quantity'],
                        (int) $row['unit_price'],
                        $document,
                        $input['created_by'] ?? null,
                    );
                }
            }

            $reloaded = $document->fresh(['items', 'warehouse']);
            assert($reloaded instanceof IncomingDocument);

            return $reloaded;
        });
    }

    private function applyStockReceipt(
        string $ingredientId,
        float $quantity,
        int $unitPrice,
        IncomingDocument $document,
        ?int $userId,
    ): void {
        /** @var Ingredient $ingredient */
        $ingredient = Ingredient::query()
            ->lockForUpdate()
            ->findOrFail($ingredientId);

        $previousBalance = (float) $ingredient->current_stock;
        $newBalance = $previousBalance + $quantity;

        $ingredient->update(['current_stock' => $newBalance]);

        StockMovement::create([
            'tenant_id' => $document->tenant_id,
            'ingredient_id' => $ingredient->id,
            'delta' => $quantity,
            'balance_after' => $newBalance,
            'reason' => StockMovementReason::Purchase->value,
            'reference_type' => 'incoming_document',
            'reference_id' => $document->id,
            'cost_per_unit' => $unitPrice > 0 ? $unitPrice : null,
            'notes' => "Kelib tushish: {$document->doc_no}",
            'recorded_at' => now(),
            'created_by' => $userId !== null ? (string) $userId : null,
            'created_at' => now(),
        ]);
    }
}
