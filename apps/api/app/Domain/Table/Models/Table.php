<?php

declare(strict_types=1);

namespace App\Domain\Table\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string|null $category_id
 * @property string $name
 * @property int $capacity
 * @property string $status
 * @property string $shape
 * @property int|null $position_x
 * @property int|null $position_y
 * @property int|null $width
 * @property int|null $height
 * @property string|null $qr_code
 * @property array<string, mixed>|null $metadata
 */
class Table extends Model
{
    use HasUuids;
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'tables';

    protected $fillable = [
        'tenant_id', 'category_id', 'name', 'capacity', 'status', 'shape',
        'position_x', 'position_y', 'width', 'height', 'qr_code', 'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'capacity' => 'integer',
            'position_x' => 'integer',
            'position_y' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TableCategory::class, 'category_id');
    }

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }
}
