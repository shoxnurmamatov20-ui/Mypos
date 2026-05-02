<?php

declare(strict_types=1);

namespace App\Domain\Employee\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\ShiftFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $employee_id
 * @property \Illuminate\Support\Carbon $scheduled_start
 * @property \Illuminate\Support\Carbon $scheduled_end
 * @property \Illuminate\Support\Carbon|null $actual_start
 * @property \Illuminate\Support\Carbon|null $actual_end
 * @property string $status
 * @property string|null $notes
 * @property-read Employee|null $employee
 * @property-read \Illuminate\Database\Eloquent\Collection<int, TimeClockEvent> $clockEvents
 */
class Shift extends Model
{
    /** @use HasFactory<ShiftFactory> */
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;

    protected $table = 'shifts';

    protected $fillable = [
        'tenant_id',
        'employee_id',
        'scheduled_start',
        'scheduled_end',
        'actual_start',
        'actual_end',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_start' => 'datetime',
            'scheduled_end' => 'datetime',
            'actual_start' => 'datetime',
            'actual_end' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function clockEvents(): HasMany
    {
        return $this->hasMany(TimeClockEvent::class, 'shift_id');
    }

    public function breaks(): HasMany
    {
        return $this->hasMany(ShiftBreak::class, 'shift_id');
    }

    public function workedMinutes(): int
    {
        $start = $this->actual_start;
        $end = $this->actual_end ?? now();
        if ($start === null) {
            return 0;
        }
        return max(0, (int) $start->diffInMinutes($end));
    }

    protected static function newFactory(): ShiftFactory
    {
        return ShiftFactory::new();
    }
}
