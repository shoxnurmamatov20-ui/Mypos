<?php

declare(strict_types=1);

namespace App\Domain\Customer\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $phone
 * @property string|null $email
 * @property string $first_name
 * @property string|null $last_name
 * @property \Illuminate\Support\Carbon|null $birthday
 * @property string $locale
 * @property string|null $gender
 * @property string|null $avatar_url
 * @property array<int, string>|null $tags
 * @property string|null $notes
 * @property int $total_orders
 * @property int $total_spent
 * @property \Illuminate\Support\Carbon|null $last_visit_at
 */
class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'customers';

    protected $fillable = [
        'tenant_id',
        'phone', 'email',
        'first_name', 'last_name',
        'birthday', 'locale', 'gender', 'avatar_url',
        'tags', 'notes',
        'total_orders', 'total_spent', 'last_visit_at',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'birthday' => 'date',
            'last_visit_at' => 'datetime',
            'total_orders' => 'integer',
            'total_spent' => 'integer',
        ];
    }

    public function loyaltyAccount(): HasOne
    {
        return $this->hasOne(LoyaltyAccount::class, 'customer_id');
    }

    public function fullName(): string
    {
        if ($this->last_name === null || $this->last_name === '') {
            return $this->first_name;
        }
        return trim($this->first_name . ' ' . $this->last_name);
    }

    public function hasTag(string $tag): bool
    {
        return is_array($this->tags) && in_array($tag, $this->tags, true);
    }

    protected static function newFactory(): CustomerFactory
    {
        return CustomerFactory::new();
    }
}
