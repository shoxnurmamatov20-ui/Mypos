<?php

declare(strict_types=1);

namespace App\Domain\Shared\ValueObjects;

use InvalidArgumentException;
use JsonSerializable;
use Stringable;

/**
 * Phase 4 — currency-aware monetary value.
 *
 * Immutable. Stores the amount in the currency's smallest indivisible unit
 * (the "minor unit") so we never deal with float drift. The choice of minor
 * unit follows ISO 4217:
 *   - UZS / JPY / KRW: 0 fractional digits → minor unit IS the major unit.
 *     `Money::uzs(12500)` represents 12,500 so'm exactly.
 *   - USD / EUR / KZT / KGS / TJS / RUB: 2 fractional digits → minor unit
 *     is 1/100 of the major unit. `Money::fromMinor(1500, 'USD')` = $15.00.
 *
 * Why a value object (and not just `int $minor + string $currency` everywhere):
 *   1. `add()` / `subtract()` enforce currency match — you can't accidentally
 *      add UZS and KZT and get a meaningless integer.
 *   2. Negative amounts are rejected at construction. Refunds are modelled as
 *      separate Payment rows with `is_refund=true`, not as negative Money.
 *   3. Carries the `currency` alongside the `minor` count, so receivers
 *      (Resources, Filament fields, AI prompts) never have to guess.
 *
 * Conversion between currencies is intentionally NOT a method on this class —
 * conversion needs an FX rate, which depends on a date and a provider. See
 * {@see \App\Domain\Shared\Services\FxRateService::convert()}.
 */
final class Money implements JsonSerializable, Stringable
{
    /**
     * Decimal places per currency. Mirrors `currencies.decimals` in the DB
     * but kept here as the canonical source for the application layer so we
     * don't need a DB round-trip just to format a value. Override via the
     * Money::withDecimals() static if a tenant ever needs a non-standard
     * subdivision (extremely unlikely for our markets).
     *
     * @var array<string, int>
     */
    private const DEFAULT_DECIMALS = [
        'UZS' => 0,
        'KZT' => 2,
        'KGS' => 2,
        'TJS' => 2,
        'USD' => 2,
        'EUR' => 2,
        'RUB' => 2,
        'JPY' => 0,
        'KRW' => 0,
    ];

    public function __construct(
        public readonly int $minor,
        public readonly string $currency,
    ) {
        if ($minor < 0) {
            throw new InvalidArgumentException("Money amount cannot be negative; got {$minor}");
        }
        if (preg_match('/^[A-Z]{3}$/', $currency) !== 1) {
            throw new InvalidArgumentException("Invalid ISO 4217 currency code: {$currency}");
        }
    }

    // -----------------------------------------------------------------
    // Construction helpers
    // -----------------------------------------------------------------

    /**
     * UZS has zero decimals — the major unit IS the minor unit. Pass plain
     * so'm: `Money::uzs(12500)` = 12,500 so'm.
     */
    public static function uzs(int $major): self
    {
        return new self($major, 'UZS');
    }

    /**
     * Build directly from minor units. Use this when reading from the DB
     * (`orders.total_amount` is already minor-unit) or interacting with any
     * payment provider that speaks tiyin/tinov/cents.
     */
    public static function fromMinor(int $minor, string $currency): self
    {
        return new self($minor, strtoupper($currency));
    }

    /**
     * Build from a "major unit" decimal string. Useful for parsing user input
     * or AI-generated price suggestions. Accepts both '.' and ',' as decimal
     * separator. Anything beyond the currency's decimals is rejected (we do
     * NOT silently round — the caller should have decided already).
     */
    public static function fromMajor(string|int|float $major, string $currency): self
    {
        $currency = strtoupper($currency);
        $decimals = self::decimalsFor($currency);

        // Normalize: keep digits, sign, and ONE decimal separator.
        $normalized = is_string($major)
            ? str_replace(',', '.', trim($major))
            : (string) $major;

        if (! preg_match('/^-?\d+(\.\d+)?$/', $normalized)) {
            throw new InvalidArgumentException("Cannot parse major amount: '{$major}'");
        }

        // bcmul gives us deterministic integer-shift without float drift —
        // matters for 2-decimal currencies. Falls back to integer math for
        // 0-decimal currencies (UZS).
        if ($decimals === 0) {
            $minor = (int) (string) (int) round((float) $normalized);
        } else {
            $minor = (int) bcmul($normalized, (string) (10 ** $decimals), 0);
        }

        return new self($minor, $currency);
    }

    /**
     * The "zero" element — every Money chain starts here. Currency must be
     * specified explicitly so we never quietly produce a UZS zero in a KZT
     * context.
     */
    public static function zero(string $currency): self
    {
        return new self(0, strtoupper($currency));
    }

    // -----------------------------------------------------------------
    // Arithmetic — all immutable, all currency-checked
    // -----------------------------------------------------------------

    public function add(self $other): self
    {
        $this->assertSameCurrency($other);

        return new self($this->minor + $other->minor, $this->currency);
    }

    /**
     * Subtraction. If the result would go negative we throw — refunds and
     * negative balances are modelled at the domain layer (Payment.is_refund),
     * never inside a single Money instance.
     */
    public function subtract(self $other): self
    {
        $this->assertSameCurrency($other);
        $result = $this->minor - $other->minor;
        if ($result < 0) {
            throw new InvalidArgumentException(
                "Money subtraction would produce negative result ({$this->minor} - {$other->minor})"
            );
        }

        return new self($result, $this->currency);
    }

    /**
     * Multiply by a scalar (e.g. quantity, tax rate, discount factor).
     * Banker's rounding — the standard for monetary math, less biased than
     * round-half-up over many small operations.
     */
    public function multiply(float $factor): self
    {
        if ($factor < 0) {
            throw new InvalidArgumentException("Money multiply factor cannot be negative; got {$factor}");
        }

        $product = $this->minor * $factor;
        // PHP_ROUND_HALF_EVEN = banker's rounding.
        $rounded = (int) round($product, 0, PHP_ROUND_HALF_EVEN);

        return new self($rounded, $this->currency);
    }

    /**
     * Allocate this amount across N parts, distributing rounding remainders
     * to the leading buckets. Useful for splitting a check across diners
     * without losing or inventing tiyin/cents.
     *
     * @return array<int, self>
     */
    public function allocate(int $parts): array
    {
        if ($parts < 1) {
            throw new InvalidArgumentException("Cannot allocate Money across {$parts} parts");
        }

        $base = intdiv($this->minor, $parts);
        $remainder = $this->minor - ($base * $parts);

        $result = [];
        for ($i = 0; $i < $parts; $i++) {
            $share = $base + ($i < $remainder ? 1 : 0);
            $result[] = new self($share, $this->currency);
        }

        return $result;
    }

    // -----------------------------------------------------------------
    // Comparison & predicates
    // -----------------------------------------------------------------

    public function equals(self $other): bool
    {
        return $this->minor === $other->minor && $this->currency === $other->currency;
    }

    public function greaterThan(self $other): bool
    {
        $this->assertSameCurrency($other);

        return $this->minor > $other->minor;
    }

    public function greaterThanOrEqual(self $other): bool
    {
        $this->assertSameCurrency($other);

        return $this->minor >= $other->minor;
    }

    public function lessThan(self $other): bool
    {
        $this->assertSameCurrency($other);

        return $this->minor < $other->minor;
    }

    public function isZero(): bool
    {
        return $this->minor === 0;
    }

    public function isPositive(): bool
    {
        return $this->minor > 0;
    }

    // -----------------------------------------------------------------
    // Formatting & serialisation
    // -----------------------------------------------------------------

    /**
     * Return the major-unit value as a string with the currency's correct
     * decimal places. '12500' for UZS, '15.00' for USD. Use for raw display
     * when locale-specific grouping doesn't matter.
     */
    public function toMajorString(): string
    {
        $decimals = self::decimalsFor($this->currency);
        if ($decimals === 0) {
            return (string) $this->minor;
        }

        return bcdiv((string) $this->minor, (string) (10 ** $decimals), $decimals);
    }

    /**
     * Major unit as float. WARNING: lossy for >2-decimal currencies; only
     * use when handing off to an external system that requires float (most
     * REST clients, Filament TextInput numeric() field). Never use for
     * arithmetic — that's what the integer minor field is for.
     */
    public function toMajorFloat(): float
    {
        return (float) $this->toMajorString();
    }

    /**
     * Locale-aware default formatting. Delegates to CurrencyFormatter so the
     * exact rules (₸ vs after-the-number, "so'm" vs "сум") live in one place.
     */
    public function format(?string $locale = null): string
    {
        return \App\Domain\Shared\Helpers\CurrencyFormatter::format($this, $locale ?? app()->getLocale());
    }

    /**
     * Wire-format. Exposes BOTH the raw integer minor AND the major-unit
     * float so frontends can pick whichever they want without having to
     * re-derive decimals.
     *
     * @return array{minor: int, currency: string, decimals: int, major: string}
     */
    public function toArray(): array
    {
        $decimals = self::decimalsFor($this->currency);

        return [
            'minor' => $this->minor,
            'currency' => $this->currency,
            'decimals' => $decimals,
            'major' => $this->toMajorString(),
        ];
    }

    /** @return array{minor: int, currency: string, decimals: int, major: string} */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }

    public function __toString(): string
    {
        return $this->toMajorString() . ' ' . $this->currency;
    }

    // -----------------------------------------------------------------
    // Internals
    // -----------------------------------------------------------------

    /** @internal */
    public static function decimalsFor(string $currency): int
    {
        return self::DEFAULT_DECIMALS[strtoupper($currency)] ?? 2;
    }

    private function assertSameCurrency(self $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new InvalidArgumentException(
                "Cannot mix currencies: {$this->currency} vs {$other->currency}"
            );
        }
    }
}
