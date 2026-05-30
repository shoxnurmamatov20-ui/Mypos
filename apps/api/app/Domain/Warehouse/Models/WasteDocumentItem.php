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
 * @property string $waste_document_id
 * @property string $ingredient_id
 * @property string $quantity
 * @property int $unit_cost
 * @property int $total_cost
 * @property string|null $notes
 */
class WasteDocumentItem extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'waste_document_items';

    protected $fillable = [
        'waste_document_id',
        'ingredient_id',
        'quantity',
        'unit_cost',
        'total_cost',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'unit_cost' => 'integer',
            'total_cost' => 'integer',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(WasteDocument::class, 'waste_document_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'ingredient_id');
    }
}
