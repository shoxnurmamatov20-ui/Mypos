<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Models;

use App\Domain\Inventory\Models\Ingredient;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $incoming_document_id
 * @property string $ingredient_id
 * @property string $quantity
 * @property int $unit_price
 * @property int $total_price
 * @property Carbon|null $expiry_date
 * @property string|null $batch_number
 * @property string|null $notes
 */
class IncomingDocumentItem extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'incoming_document_items';

    protected $fillable = [
        'incoming_document_id',
        'ingredient_id',
        'quantity',
        'unit_price',
        'total_price',
        'expiry_date',
        'batch_number',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'unit_price' => 'integer',
            'total_price' => 'integer',
            'expiry_date' => 'date',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(IncomingDocument::class, 'incoming_document_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'ingredient_id');
    }
}
