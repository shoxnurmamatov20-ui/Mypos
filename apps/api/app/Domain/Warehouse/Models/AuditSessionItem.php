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
 * @property string $audit_session_id
 * @property string $ingredient_id
 * @property string $expected_quantity
 * @property string|null $actual_quantity
 * @property string $discrepancy
 * @property string|null $notes
 */
class AuditSessionItem extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'audit_session_items';

    protected $fillable = [
        'audit_session_id',
        'ingredient_id',
        'expected_quantity',
        'actual_quantity',
        'discrepancy',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'expected_quantity' => 'decimal:3',
            'actual_quantity' => 'decimal:3',
            'discrepancy' => 'decimal:3',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AuditSession::class, 'audit_session_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'ingredient_id');
    }
}
