<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Actions;

use App\Domain\Inventory\Enums\StockMovementReason;
use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Inventory\Models\StockMovement;
use App\Domain\Warehouse\Enums\TransferStatus;
use App\Domain\Warehouse\Models\TransferDocument;
use App\Domain\Warehouse\Models\TransferDocumentItem;
use App\Domain\Warehouse\Models\Warehouse;
use App\Domain\Warehouse\Support\DocumentNumberGenerator;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Creates a warehouse-to-warehouse transfer (Ko'chirish). Each line item
 * produces TWO stock movements when the document is moved to status=received:
 *   - a `transfer` deduction in the from warehouse
 *   - a `transfer` receipt in the to warehouse
 *
 * For status=draft|sent we only persist the rows without moving stock — the
 * stock motion happens on `received`.
 *
 * NB: until ingredients become truly warehouse-scoped (per-warehouse stock
 * tables), MyPOS represents stock as a single `ingredients.current_stock`
 * column. A cross-warehouse transfer therefore nets to zero for the
 * ingredient as a whole — both the deduction and the receipt land on the
 * same row. We still produce both StockMovement records so reports can
 * trace the motion. When the per-warehouse-stock migration ships this
 * action can be amended in one place.
 */
class CreateTransferAction
{
    /**
     * @param array{
     *   tenant_id?: string|null,
     *   from_warehouse_id: string,
     *   to_warehouse_id: string,
     *   doc_date?: string|\DateTimeInterface|null,
     *   status?: string,
     *   notes?: string|null,
     *   created_by?: int|null,
     *   items: array<int, array{
     *     ingredient_id: string,
     *     quantity: float|int|string,
     *     notes?: string|null,
     *   }>,
     * } $input
     */
    public function __invoke(array $input): TransferDocument
    {
        if ($input['from_warehouse_id'] === $input['to_warehouse_id']) {
            throw ValidationException::withMessages([
                'to_warehouse_id' => ['Maqsad ombor manba ombordan farq qilishi kerak.'],
            ]);
        }

        if (empty($input['items'])) {
            throw ValidationException::withMessages([
                'items' => ['Hujjat hech bo\'lmaganda 1 ta band bo\'lishi kerak.'],
            ]);
        }

        return DB::transaction(function () use ($input): TransferDocument {
            /** @var Warehouse $from */
            $from = Warehouse::query()->findOrFail($input['from_warehouse_id']);
            /** @var Warehouse $to */
            $to = Warehouse::query()->findOrFail($input['to_warehouse_id']);

            if ($from->tenant_id !== $to->tenant_id) {
                throw ValidationException::withMessages([
                    'to_warehouse_id' => ['Omborlar bitta tenantga tegishli bo\'lishi kerak.'],
                ]);
            }

            $tenantId = $input['tenant_id'] ?? $from->tenant_id;
            $docDate = isset($input['doc_date']) ? Carbon::parse($input['doc_date']) : now();
            $status = TransferStatus::tryFrom((string) ($input['status'] ?? TransferStatus::Received->value))
                ?? TransferStatus::Received;

            $docNo = DocumentNumberGenerator::generate(
                TransferDocument::class,
                'TRN',
                $tenantId,
                $docDate,
            );

            /** @var TransferDocument $document */
            $document = TransferDocument::create([
                'tenant_id' => $tenantId,
                'from_warehouse_id' => $from->id,
                'to_warehouse_id' => $to->id,
                'doc_no' => $docNo,
                'doc_date' => $docDate->toDateString(),
                'status' => $status->value,
                'notes' => $input['notes'] ?? null,
                'created_by' => $input['created_by'] ?? null,
            ]);

            // stock_movements.created_by stores the user *uuid*, not the
            // bigint users.id that documents keep — resolve it once.
            $creatorUuid = $status === TransferStatus::Received
                ? $this->creatorUuid($input['created_by'] ?? null)
                : null;

            foreach ($input['items'] as $row) {
                $qty = (float) $row['quantity'];
                if ($qty <= 0) {
                    throw ValidationException::withMessages([
                        'items' => ['Har bir bandning miqdori 0 dan katta bo\'lishi kerak.'],
                    ]);
                }

                TransferDocumentItem::create([
                    'transfer_document_id' => $document->id,
                    'ingredient_id' => $row['ingredient_id'],
                    'quantity' => $qty,
                    'notes' => $row['notes'] ?? null,
                ]);

                if ($status === TransferStatus::Received) {
                    $this->moveStock(
                        $row['ingredient_id'],
                        $qty,
                        $document,
                        $creatorUuid,
                    );
                }
            }

            $reloaded = $document->fresh(['items', 'fromWarehouse', 'toWarehouse']);
            assert($reloaded instanceof TransferDocument);

            return $reloaded;
        });
    }

    private function moveStock(
        string $ingredientId,
        float $quantity,
        TransferDocument $document,
        ?string $creatorUuid,
    ): void {
        /** @var Ingredient $ingredient */
        $ingredient = Ingredient::query()
            ->lockForUpdate()
            ->findOrFail($ingredientId);

        $balance = (float) $ingredient->current_stock;

        // Guard: refuse to transfer more than is on hand at the source.
        if ($quantity > $balance) {
            $name = is_array($ingredient->name) ? ($ingredient->name['uz'] ?? reset($ingredient->name)) : (string) $ingredient->name;
            throw ValidationException::withMessages([
                'items' => [
                    "Manba omborda yetarli qoldiq yo'q: \"{$name}\" — joriy {$balance}, so'ralgan {$quantity}.",
                ],
            ]);
        }

        // Deduction movement (from warehouse).
        StockMovement::create([
            'tenant_id' => $document->tenant_id,
            'ingredient_id' => $ingredient->id,
            'delta' => -$quantity,
            'balance_after' => $balance - $quantity,
            'reason' => StockMovementReason::Transfer->value,
            'reference_type' => 'transfer_document_out',
            'reference_id' => $document->id,
            'cost_per_unit' => null,
            'notes' => "Ko'chirish chiqim: {$document->doc_no} ({$document->from_warehouse_id} -> {$document->to_warehouse_id})",
            'recorded_at' => now(),
            'created_by' => $creatorUuid,
            'created_at' => now(),
        ]);

        // Receipt movement (to warehouse). Net effect on the ingredient row
        // is zero — by design, until per-warehouse stock lands.
        StockMovement::create([
            'tenant_id' => $document->tenant_id,
            'ingredient_id' => $ingredient->id,
            'delta' => $quantity,
            'balance_after' => $balance,
            'reason' => StockMovementReason::Transfer->value,
            'reference_type' => 'transfer_document_in',
            'reference_id' => $document->id,
            'cost_per_unit' => null,
            'notes' => "Ko'chirish kirim: {$document->doc_no} ({$document->from_warehouse_id} -> {$document->to_warehouse_id})",
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
