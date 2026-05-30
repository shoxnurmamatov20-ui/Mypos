<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Models;

use App\Domain\Inventory\Models\Ingredient;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\WarehouseFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $name
 * @property string|null $address
 * @property bool $is_active
 * @property bool $is_default
 * @property int $sort_order
 * @property string|null $notes
 */
class Warehouse extends Model
{
    use BelongsToTenant;

    /** @use HasFactory<WarehouseFactory> */
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $table = 'warehouses';

    protected $fillable = [
        'tenant_id',
        'name',
        'address',
        'is_active',
        'is_default',
        'sort_order',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function ingredients(): HasMany
    {
        return $this->hasMany(Ingredient::class, 'warehouse_id');
    }

    public function incomingDocuments(): HasMany
    {
        return $this->hasMany(IncomingDocument::class, 'warehouse_id');
    }

    public function wasteDocuments(): HasMany
    {
        return $this->hasMany(WasteDocument::class, 'warehouse_id');
    }

    public function auditSessions(): HasMany
    {
        return $this->hasMany(AuditSession::class, 'warehouse_id');
    }

    public function transfersFrom(): HasMany
    {
        return $this->hasMany(TransferDocument::class, 'from_warehouse_id');
    }

    public function transfersTo(): HasMany
    {
        return $this->hasMany(TransferDocument::class, 'to_warehouse_id');
    }

    protected static function newFactory(): WarehouseFactory
    {
        return WarehouseFactory::new();
    }
}
