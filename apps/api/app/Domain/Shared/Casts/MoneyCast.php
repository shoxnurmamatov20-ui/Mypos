<?php

declare(strict_types=1);

namespace App\Domain\Shared\Casts;

use App\Domain\Shared\ValueObjects\Money;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

/**
 * Phase 4 — Eloquent cast that pairs a `*_minor` integer column with a
 * `*_currency` (or single shared `currency`) char(3) column into a single
 * {@see Money} value object on read, and splits it back on write.
 *
 * Usage on a model:
 *
 *     protected function casts(): array
 *     {
 *         return [
 *             // Pair `total_amount` (int) + `currency` (string) → $order->total
 *             'total' => MoneyCast::class . ':total_amount,currency',
 *
 *             // Pair `subtotal_amount` (int) + `currency` (string) → $order->subtotal
 *             'subtotal' => MoneyCast::class . ':subtotal_amount,currency',
 *         ];
 *     }
 *
 * The cast key (`total`, `subtotal`) is virtual — it doesn't correspond to a
 * real column. Reads and writes both go through the underlying minor +
 * currency columns, so this is purely an ergonomic layer; no schema change
 * is needed beyond having the two columns exist.
 *
 * Why a custom cast (vs. just exposing a helper method like `total()`):
 *   - $order->total is a Money you can `add()`/`subtract()` on directly.
 *   - Resources can do `'total' => $order->total` and the JsonSerializable
 *     interface kicks in automatically.
 *   - Setter validation: assigning a non-Money to $order->total throws,
 *     catching mistakes at write-time instead of producing zero values.
 *
 * The cast does NOT support nullable Money — if the underlying minor column
 * is null (or 0 with a missing currency) the getter returns null. Setting
 * to null clears both columns. This matches every existing nullable money
 * column in the schema (delivery_fee_minor, courier_earnings_minor, etc.).
 */
final class MoneyCast implements CastsAttributes
{
    public function __construct(
        private readonly string $minorColumn,
        private readonly string $currencyColumn = 'currency',
    ) {}

    /**
     * Read both columns and assemble a Money. Returns null when the minor
     * column is null — matches existing "money is optional" semantics on
     * delivery fees, courier earnings, etc.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?Money
    {
        $minorRaw = $attributes[$this->minorColumn] ?? null;
        if ($minorRaw === null || $minorRaw === '') {
            return null;
        }

        $currency = $attributes[$this->currencyColumn] ?? null;
        if (! is_string($currency) || $currency === '') {
            // Grandfathered Phase-1 rows — no currency was stored. Default to
            // UZS so legacy data doesn't blow up the getter. New writes always
            // populate the currency column via the setter, so this branch
            // only ever fires on un-migrated historical rows.
            $currency = 'UZS';
        }

        return Money::fromMinor((int) $minorRaw, strtoupper($currency));
    }

    /**
     * Split a Money into the two underlying columns. Accepts:
     *   - Money instance → split as expected
     *   - null → both columns set to null
     *   - int → write as-is to the minor column, leave the currency column
     *     untouched (legacy code-path so existing `$order->total_amount = 1000`
     *     style mass-assignment still works during migration).
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        if ($value === null) {
            return [
                $this->minorColumn => null,
                $this->currencyColumn => null,
            ];
        }

        if ($value instanceof Money) {
            return [
                $this->minorColumn => $value->minor,
                $this->currencyColumn => $value->currency,
            ];
        }

        if (is_int($value) || (is_string($value) && ctype_digit($value))) {
            // Legacy / partial migration path — caller passed a raw minor
            // value. Don't touch the currency column.
            return [$this->minorColumn => (int) $value];
        }

        throw new InvalidArgumentException(
            "MoneyCast expected Money|int|null, got " . get_debug_type($value)
        );
    }
}
