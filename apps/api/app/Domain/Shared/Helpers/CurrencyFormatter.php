<?php

declare(strict_types=1);

namespace App\Domain\Shared\Helpers;

use App\Domain\Shared\ValueObjects\Money;

/**
 * Phase 4 — locale-aware monetary formatting.
 *
 * The single place that knows how each (currency, locale) pair should
 * render. Centralising here avoids the situation where a Filament table
 * column shows "12,500 UZS", a Resource shows "12 500 so'm", and the email
 * receipt shows "12500 so'm" — all for the same row.
 *
 * Conventions:
 *   - Thousands separator: locale-specific (uz/ky/tg use NBSP, ru/kz use
 *     comma in colloquial usage but NBSP in formal — we pick NBSP for
 *     readability across all CIS locales).
 *   - Decimal separator: locale-specific. Period for en, comma elsewhere.
 *   - Symbol position: matches local print convention. "12 500 so'm" not
 *     "so'm 12 500"; "$15.00" with leading $; "₸ 1 500" with leading ₸.
 *   - Decimals shown: matches the currency's `decimals` (UZS = 0, USD = 2).
 *
 * Falls back gracefully on unknown (currency, locale) pairs by emitting
 * "{CODE} {amount-with-decimals}" — never throws.
 */
final class CurrencyFormatter
{
    /**
     * Format a {@see Money} into a localised display string.
     *
     * @param  string  $locale  BCP-47 tag (uz, ru, en, kz, ky, tg). Falls
     *                          back to en for unknown values.
     */
    public static function format(Money $money, string $locale): string
    {
        $locale = self::normaliseLocale($locale);
        $amount = self::formatAmount($money, $locale);

        return match ([$money->currency, $locale]) {
            ['UZS', 'uz'] => $amount . " so'm",
            ['UZS', 'ru'] => $amount . ' сум',
            ['UZS', 'en'] => $amount . ' UZS',

            ['KZT', 'kz'], ['KZT', 'ky'] => $amount . ' ₸',
            ['KZT', 'ru'] => $amount . ' тг',
            ['KZT', 'en'] => '₸ ' . $amount,

            ['KGS', 'ky'] => $amount . ' сом',
            ['KGS', 'kz'], ['KGS', 'ru'] => $amount . ' сом',
            ['KGS', 'en'] => $amount . ' KGS',

            ['TJS', 'tg'] => $amount . ' с.',
            ['TJS', 'ru'] => $amount . ' смн',
            ['TJS', 'en'] => $amount . ' TJS',

            ['RUB', 'ru'] => $amount . ' ₽',
            ['RUB', 'en'] => '₽ ' . $amount,

            ['USD', 'uz'], ['USD', 'ru'], ['USD', 'kz'], ['USD', 'ky'], ['USD', 'tg'] => '$' . $amount,
            ['USD', 'en'] => '$' . $amount,

            ['EUR', 'en'] => '€' . $amount,
            ['EUR', 'uz'], ['EUR', 'ru'], ['EUR', 'kz'], ['EUR', 'ky'], ['EUR', 'tg'] => $amount . ' €',

            // Catch-all: code + amount, never throws.
            default => $money->currency . ' ' . $amount,
        };
    }

    /**
     * Pure number formatting — separators only, no symbol. Used when the
     * caller wants to render the symbol themselves (e.g. a Filament column
     * that shows the symbol in a separate field).
     */
    public static function formatAmount(Money $money, string $locale): string
    {
        $decimals = Money::decimalsFor($money->currency);
        $major = $money->toMajorString();
        $locale = self::normaliseLocale($locale);

        // Split into integer + fractional halves so we can swap separators
        // without confusing PHP's NumberFormatter (which we deliberately
        // avoid — it requires intl + the right locale data installed,
        // which we cannot guarantee on all production hosts).
        if (str_contains($major, '.')) {
            [$intPart, $fracPart] = explode('.', $major, 2);
        } else {
            $intPart = $major;
            $fracPart = '';
        }

        // Group integer digits in 3s with the locale's thousands separator.
        $thousandsSep = self::thousandsSeparator($locale);
        $decimalSep = self::decimalSeparator($locale);

        $intGrouped = number_format((int) $intPart, 0, '.', $thousandsSep);

        if ($decimals === 0 || $fracPart === '') {
            return $intGrouped;
        }

        // Pad fractional with zeros to currency's decimals (e.g. "5" → "50"
        // for a 2-decimal currency).
        $fracPadded = str_pad($fracPart, $decimals, '0', STR_PAD_RIGHT);

        return $intGrouped . $decimalSep . $fracPadded;
    }

    private static function normaliseLocale(string $locale): string
    {
        $lower = strtolower(substr($locale, 0, 2));
        return in_array($lower, ['uz', 'ru', 'en', 'kz', 'ky', 'tg'], true)
            ? $lower
            : 'en';
    }

    private static function thousandsSeparator(string $locale): string
    {
        return match ($locale) {
            'en' => ',',
            // U+00A0 NO-BREAK SPACE — keeps "12 500" on one line in
            // narrow columns and PDF receipts. CIS-standard for printed
            // typography.
            default => "\u{00A0}",
        };
    }

    private static function decimalSeparator(string $locale): string
    {
        return $locale === 'en' ? '.' : ',';
    }
}
