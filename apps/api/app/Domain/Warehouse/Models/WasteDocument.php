<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Warehouse\Enums\WasteReason;
use App\Domain\Warehouse\Enums\WasteStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $warehouse_id
 * @property string $doc_no
 * @property Carbon $doc_date
 * @property string $reason
 * @property int $total_cost
 * @property string $status
 * @property string|null $notes
 * @property int|null $created_by
 */
class WasteDocument extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $table = 'waste_documents';

    protected $fillable = [
        'tenant_id',
        'warehouse_id',
        'doc_no',
        'doc_date',
        'reason',
        'total_cost',
        'status',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'doc_date' => 'date',
            'total_cost' => 'integer',
            'created_by' => 'integer',
        ];
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(WasteDocumentItem::class, 'waste_document_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function statusEnum(): ?WasteStatus
    {
        return WasteStatus::tryFrom($this->status);
    }

    public function reasonEnum(): ?WasteReason
    {
        return WasteReason::tryFrom($this->reason);
    }
}
