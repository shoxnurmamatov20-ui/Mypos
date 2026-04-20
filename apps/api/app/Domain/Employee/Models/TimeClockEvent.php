<?php

declare(strict_types=1);

namespace App\Domain\Employee\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string|null $shift_id
 * @property string $employee_id
 * @property string $event_type
 * @property \Illuminate\Support\Carbon $recorded_at
 * @property string $source
 * @property array<string, mixed>|null $metadata
 * @property-read Employee|null $employee
 * @property-read Shift|null $shift
 */
class TimeClockEvent extends Model
{
    use HasUuids;
    use BelongsToTenant;

    protected $table = 'time_clock_events';

    /**
     * Only the created_at timestamp is tracked (no updated_at).
     *
     * @var string
     */
    public const UPDATED_AT = null;

    protected $fillable = [
        'tenant_id',
        'shift_id',
        'employee_id',
        'event_type',
        'recorded_at',
        'source',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'recorded_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class, 'shift_id');
    }
}
