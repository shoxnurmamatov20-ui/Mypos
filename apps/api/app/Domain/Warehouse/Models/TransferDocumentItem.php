<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Models;

use App\Domain\Inventory\Models\Ingredient;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $transfer_document_id
 * @property string $ingredient_id
 * @property string $quantity
 * @property string|null $notes
 */
class TransferDocumentItem extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'transfer_document_items';

    protected $fillable = [
        'transfer_document_id',
        'ingredient_id',
        'quantity',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(TransferDocument::class, 'transfer_document_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'ingredient_id');
    }
}
