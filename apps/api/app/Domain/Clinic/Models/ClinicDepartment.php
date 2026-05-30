<?php

declare(strict_types=1);

namespace App\Domain\Clinic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $clinic_id
 * @property string $name
 * @property bool $is_active
 */
class ClinicDepartment extends Model
{
    protected $table = 'clinic_departments';

    protected $fillable = [
        'clinic_id',
        'name',
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

    public function doctors(): HasMany
    {
        return $this->hasMany(ClinicDoctor::class, 'department_id');
    }
}
