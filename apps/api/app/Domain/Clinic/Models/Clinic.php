<?php

declare(strict_types=1);

namespace App\Domain\Clinic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $address
 * @property string|null $phone
 * @property string|null $region
 * @property string|null $logo_url
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Clinic extends Model
{
    protected $table = 'clinics';

    protected $fillable = [
        'name',
        'slug',
        'address',
        'phone',
        'region',
        'logo_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function departments(): HasMany
    {
        return $this->hasMany(ClinicDepartment::class, 'clinic_id');
    }

    public function doctors(): HasMany
    {
        return $this->hasMany(ClinicDoctor::class, 'clinic_id');
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(ClinicFeedback::class, 'clinic_id');
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(ClinicComplaint::class, 'clinic_id');
    }
}
