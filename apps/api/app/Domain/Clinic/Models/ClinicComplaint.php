<?php

declare(strict_types=1);

namespace App\Domain\Clinic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $clinic_id
 * @property int|null $department_id
 * @property int|null $doctor_id
 * @property string $severity
 * @property string $status
 * @property bool $is_urgent
 * @property string|null $summary
 * @property \Illuminate\Support\Carbon|null $resolved_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class ClinicComplaint extends Model
{
    public const STATUSES = ['open', 'in_review', 'resolved', 'escalated'];

    public const SEVERITIES = ['low', 'medium', 'high', 'urgent'];

    /** SLA — open/in_review older than this surfaces in the "stale" filter. */
    public const STALE_HOURS = 72;

    protected $table = 'clinic_complaints';

    protected $fillable = [
        'clinic_id',
        'department_id',
        'doctor_id',
        'severity',
        'status',
        'is_urgent',
        'summary',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'is_urgent' => 'boolean',
            'resolved_at' => 'datetime',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class, 'clinic_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(ClinicDepartment::class, 'department_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(ClinicDoctor::class, 'doctor_id');
    }
}
