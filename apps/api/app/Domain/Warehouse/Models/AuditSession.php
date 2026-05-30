<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Warehouse\Enums\AuditStatus;
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
 * @property Carbon $started_at
 * @property Carbon|null $completed_at
 * @property int|null $conducted_by
 * @property string $status
 * @property int $discrepancy_count
 * @property string|null $notes
 */
class AuditSession extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $table = 'audit_sessions';

    protected $fillable = [
        'tenant_id',
        'warehouse_id',
        'doc_no',
        'started_at',
        'completed_at',
        'conducted_by',
        'status',
        'discrepancy_count',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'conducted_by' => 'integer',
            'discrepancy_count' => 'integer',
        ];
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(AuditSessionItem::class, 'audit_session_id');
    }

    public function conductor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'conducted_by');
    }

    public function statusEnum(): ?AuditStatus
    {
        return AuditStatus::tryFrom($this->status);
    }
}
