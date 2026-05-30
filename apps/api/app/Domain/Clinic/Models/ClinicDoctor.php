<?php

declare(strict_types=1);

namespace App\Domain\Clinic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $clinic_id
 * @property int|null $department_id
 * @property string $name
 * @property string|null $specialty
 * @property string|null $photo_url
 * @property bool $is_active
 */
class ClinicDoctor extends Model
{
    protected $table = 'clinic_doctors';

    protected $fillable = [
        'clinic_id',
        'department_id',
        'name',
        'specialty',
        'photo_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
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

    public function feedback(): HasMany
    {
        return $this->hasMany(ClinicFeedback::class, 'doctor_id');
    }
}
