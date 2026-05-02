<?php

declare(strict_types=1);

namespace App\Domain\Employee\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Models\User;
use Database\Factories\EmployeeFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $user_uuid
 * @property string $employee_code
 * @property string $position
 * @property \Illuminate\Support\Carbon $hire_date
 * @property int|null $base_salary
 * @property int|null $hourly_rate
 * @property string $status
 * @property string|null $pin_code_hash
 * @property \Illuminate\Support\Carbon|null $pin_set_at
 * @property \Illuminate\Support\Carbon|null $last_clock_in_at
 * @property \Illuminate\Support\Carbon|null $terminated_at
 * @property string|null $notes
 * @property string|null $emergency_contact
 * @property array<int, array{type: string, url: string, uploaded_at: string}>|null $documents
 * @property-read User|null $user
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Shift> $shifts
 * @property-read \Illuminate\Database\Eloquent\Collection<int, TimeClockEvent> $clockEvents
 */
class Employee extends Model
{
    /** @use HasFactory<EmployeeFactory> */
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'employees';

    protected $fillable = [
        'tenant_id',
        'user_uuid',
        'employee_code',
        'position',
        'hire_date',
        'base_salary',
        'hourly_rate',
        'status',
        'pin_code_hash',
        'pin_set_at',
        'last_clock_in_at',
        'terminated_at',
        'notes',
        'emergency_contact',
        'documents',
    ];

    protected $hidden = [
        'pin_code_hash',
    ];

    protected function casts(): array
    {
        return [
            'hire_date' => 'date',
            'base_salary' => 'integer',
            'hourly_rate' => 'integer',
            'pin_set_at' => 'datetime',
            'last_clock_in_at' => 'datetime',
            'terminated_at' => 'datetime',
            'documents' => 'array',
        ];
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->terminated_at === null;
    }

    public function breaks(): HasMany
    {
        return $this->hasMany(ShiftBreak::class, 'employee_id');
    }

    /**
     * The User record backing this Employee. The FK is `user_uuid` → `users.uuid`
     * (unique column, not PK). Laravel defaults would look up `users.id` (bigint),
     * so we specify both columns explicitly.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_uuid', 'uuid');
    }

    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class, 'employee_id');
    }

    public function clockEvents(): HasMany
    {
        return $this->hasMany(TimeClockEvent::class, 'employee_id');
    }

    public function latestShift(): HasMany
    {
        return $this->hasMany(Shift::class, 'employee_id')
            ->orderByDesc('scheduled_start');
    }

    protected static function newFactory(): EmployeeFactory
    {
        return EmployeeFactory::new();
    }
}
