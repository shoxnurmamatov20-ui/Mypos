<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Warehouse\Enums\TransferStatus;
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
 * @property string $from_warehouse_id
 * @property string $to_warehouse_id
 * @property string $doc_no
 * @property Carbon $doc_date
 * @property string $status
 * @property string|null $notes
 * @property int|null $created_by
 */
class TransferDocument extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $table = 'transfer_documents';

    protected $fillable = [
        'tenant_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'doc_no',
        'doc_date',
        'status',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'doc_date' => 'date',
            'created_by' => 'integer',
        ];
    }

    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(TransferDocumentItem::class, 'transfer_document_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function statusEnum(): ?TransferStatus
    {
        return TransferStatus::tryFrom($this->status);
    }
}
