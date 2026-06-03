<?php

declare(strict_types=1);

namespace App\Domain\Unit\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\UnitOfMeasureFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Unit of measure ("O'lchov birligi") — kg / litr / dona, etc.
 *
 * Simple tenant-scoped reference data. `type` is one of a fixed set of
 * categories: weight | volume | count | length.
 *
 * @property string $id
 * @property string $tenant_id
 * @property string $name           e.g. "Kilogramm"
 * @property string $abbreviation   e.g. "kg"
 * @property string $type           weight|volume|count|length
 * @property bool $is_active
 * @property int $sort_order
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class UnitOfMeasure extends Model
{
    /** @use HasFactory<UnitOfMeasureFactory> */
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'units_of_measure';

    protected $fillable = [
        'tenant_id',
        'name',
        'abbreviation',
        'type',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function newFactory(): UnitOfMeasureFactory
    {
        return UnitOfMeasureFactory::new();
    }
}
