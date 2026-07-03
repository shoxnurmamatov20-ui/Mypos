<?php

declare(strict_types=1);

namespace App\Domain\Customer\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\LoyaltyProgramFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $tenant_id
 * @property array<string, string> $name
 * @property bool $is_active
 * @property string $points_per_currency_unit
 * @property int $redemption_rate_uzs
 * @property array<string, mixed>|null $tier_rules
 */
class LoyaltyProgram extends Model
{
    use BelongsToTenant;

    /** @use HasFactory<LoyaltyProgramFactory> */
    use HasFactory;

    use HasUuids;

    protected $table = 'loyalty_programs';

    protected $fillable = [
        'tenant_id',
        'name',
        'is_active',
        'points_per_currency_unit',
        'redemption_rate_uzs',
        'tier_rules',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'tier_rules' => 'array',
            'is_active' => 'boolean',
            'redemption_rate_uzs' => 'integer',
        ];
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(LoyaltyAccount::class, 'program_id');
    }

    public function name(string $locale = 'uz'): string
    {
        return $this->name[$locale] ?? $this->name['uz'] ?? '';
    }

    /** Points awarded for a given spend (minor units UZS). */
    public function pointsForSpend(int $amount): int
    {
        $rate = (float) $this->points_per_currency_unit;

        return (int) floor($amount * $rate);
    }

    protected static function newFactory(): LoyaltyProgramFactory
    {
        return LoyaltyProgramFactory::new();
    }
}
