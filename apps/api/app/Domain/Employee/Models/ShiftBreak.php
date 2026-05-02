<?php

declare(strict_types=1);

namespace App\Domain\Employee\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\ShiftBreakFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $shift_id
 * @property string $employee_id
 * @property \Illuminate\Support\Carbon $started_at
 * @property \Illuminate\Support\Carbon|null $ended_at
 * @property int|null $duration_minutes
 * @property string|null $reason
 * @property string|null $notes
 * @property-read Shift|null $shift
 * @property-read Employee|null $employee
 */
class ShiftBreak extends Model
{
    /** @use HasFactory<ShiftBreakFactory> */
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;

    protected $table = 'shift_breaks';

    protected $fillable = [
        'tenant_id',
        'shift_id',
        'employee_id',
        'started_at',
        'ended_at',
        'duration_minutes',
        'reason',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'duration_minutes' => 'integer',
        ];
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class, 'shift_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function isOpen(): bool
    {
        return $this->ended_at === null;
    }

    protected static function newFactory(): ShiftBreakFactory
    {
        return ShiftBreakFactory::new();
    }
}
