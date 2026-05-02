<?php

declare(strict_types=1);

namespace App\Domain\Customer\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $phone               PII — encrypted at rest (Crypt::)
 * @property string|null $phone_index    HMAC-SHA256 of normalised phone, used for O(log n) lookups
 * @property string|null $email          PII — encrypted at rest
 * @property string $first_name
 * @property string|null $last_name
 * @property \Illuminate\Support\Carbon|null $birthday
 * @property string $locale
 * @property string|null $gender
 * @property string|null $avatar_url
 * @property array<int, string>|null $tags
 * @property string|null $notes          PII — encrypted at rest
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
        'phone', 'phone_index', 'email',
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
            // PII (CLAUDE.md §7) — Crypt:: at rest
            'phone' => 'encrypted',
            'email' => 'encrypted',
            'notes' => 'encrypted',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Customer $customer): void {
            // Maintain phone_index HMAC for fast equality lookup since
            // 'phone' is encrypted and ciphertext differs every save.
            if ($customer->isDirty('phone')) {
                $phone = $customer->phone;
                $customer->phone_index = is_string($phone) && $phone !== ''
                    ? self::hashPhone($phone)
                    : null;
            }
        });
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

    /**
     * Normalise a phone number to digits-only.
     *
     * Strips '+', spaces, dashes, parens, and any non-digit. This way:
     *   '+998 90 111 22 33', '+998-90-111-22-33', '998901112233'
     * all collapse to '998901112233' and produce the same HMAC.
     */
    public static function normalizePhone(string $phone): string
    {
        return (string) preg_replace('/\D/', '', $phone);
    }

    /**
     * Compute HMAC-SHA256(app.key, normalised(phone)). Used for the
     * `phone_index` lookup column.
     *
     * NOTE: we use `config('app.key')` raw — including any `base64:` prefix —
     * because the index is referenced from tests and other call sites with
     * `hash_hmac('sha256', $phone, config('app.key'))` directly.
     */
    public static function hashPhone(string $phone): string
    {
        return hash_hmac(
            'sha256',
            self::normalizePhone($phone),
            (string) config('app.key'),
        );
    }

    /**
     * Find a customer by phone using the HMAC index column.
     * Replaces the (now-broken) `where('phone', $phone)` query.
     */
    public function scopeWherePhone(Builder $query, string $phone): Builder
    {
        return $query->where('phone_index', self::hashPhone($phone));
    }

    protected static function newFactory(): CustomerFactory
    {
        return CustomerFactory::new();
    }
}
