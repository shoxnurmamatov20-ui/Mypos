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
 * @property int|null $rating
 * @property bool $is_verified
 * @property int|null $trust_score
 * @property string|null $sentiment
 * @property string|null $comment_redacted
 * @property \Illuminate\Support\Carbon|null $submitted_at
 */
class ClinicFeedback extends Model
{
    protected $table = 'clinic_feedback';

    protected $fillable = [
        'clinic_id',
        'department_id',
        'doctor_id',
        'rating',
        'is_verified',
        'trust_score',
        'sentiment',
        'comment_redacted',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'rating' => 'integer',
            'trust_score' => 'integer',
            'submitted_at' => 'datetime',
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
