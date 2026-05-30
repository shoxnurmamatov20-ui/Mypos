<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Warehouse\Enums\IncomingStatus;
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
 * @property string|null $supplier_name
 * @property string|null $supplier_inn
 * @property int $total_amount
 * @property string $currency
 * @property string $status
 * @property string|null $notes
 * @property int|null $created_by
 */
class IncomingDocument extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $table = 'incoming_documents';

    protected $fillable = [
        'tenant_id',
        'warehouse_id',
        'doc_no',
        'doc_date',
        'supplier_name',
        'supplier_inn',
        'total_amount',
        'currency',
        'status',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'doc_date' => 'date',
            'total_amount' => 'integer',
            'created_by' => 'integer',
        ];
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(IncomingDocumentItem::class, 'incoming_document_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function statusEnum(): ?IncomingStatus
    {
        return IncomingStatus::tryFrom($this->status);
    }
}
