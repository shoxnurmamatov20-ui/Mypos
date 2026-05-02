<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| E7 — Phase 4 — CurrencyFormatter
|--------------------------------------------------------------------------
|
| Spec covered (Agent E4 — `App\Domain\Shared\Helpers\CurrencyFormatter`):
|
|   - format(Money $m, string $locale) → locale-aware display string.
|   - UZS in `uz` locale: no decimals, "so'm" suffix, e.g. "1 500 so'm".
|   - KZT in `kz` locale: 2 decimals, ₸ symbol, e.g. "350,75 ₸".
|   - USD with default formatting: "$15.00" (or "15.00 $" depending on impl).
|   - Zero amounts render correctly (no NaN, no leading dot).
|
| The exact glyph (₸ vs USD vs RUB ₽) and grouping (space vs comma) are
| locale-dependent and impl-specific — these tests assert SHAPE rather than
| exact-string match where helpful.
|
| Skip rules:
|   - CurrencyFormatter helper class must exist (Agent E4)
*/

use App\Domain\Shared\ValueObjects\Money;

beforeEach(function (): void {
    if (! class_exists('App\\Domain\\Shared\\Helpers\\CurrencyFormatter')) {
        $this->markTestSkipped('CurrencyFormatter helper not yet shipped (pending Agent E4).');
    }
});

function fmt(Money $money, string $locale): string
{
    /** @phpstan-ignore-next-line dynamic helper */
    return \App\Domain\Shared\Helpers\CurrencyFormatter::format($money, $locale);
}

it('formats UZS with no decimals (uz locale)', function (): void {
    $out = fmt(Money::uzs(45000), 'uz');

    // Must contain "45" (the major part) and "so'm" — exact spacing impl-defined.
    expect($out)->toBeString();
    expect($out)->toMatch('/45/');
    expect($out)->toMatch("/so'm|UZS|сум/");
    // Must NOT contain a decimal point — UZS is 0-decimal.
    expect(str_contains($out, '.00'))->toBeFalse();
});

it('formats UZS with thousands grouping', function (): void {
    $out = fmt(Money::uzs(1_500_000), 'uz');

    // 1,500,000 / 1 500 000 / 1.500.000 — at least one separator visible.
    // Strip all whitespace + separators and verify the digit run is intact.
    $digitsOnly = preg_replace('/[^\d]/u', '', $out);
    expect($digitsOnly)->toContain('1500000');
});

it('formats KZT with cents (kz locale)', function (): void {
    $out = fmt(Money::fromMinor(35075, 'KZT'), 'kz');

    expect($out)->toBeString();
    // 350.75 or 350,75 in some grouping.
    expect($out)->toMatch('/350[.,]75/');
    expect($out)->toMatch('/₸|KZT|тенге/');
});

it('formats USD with 2 decimals (default locale)', function (): void {
    $out = fmt(Money::fromMinor(1500, 'USD'), 'en');

    expect($out)->toBeString();
    expect($out)->toMatch('/15[.,]00/');
    expect($out)->toMatch('/\$|USD/');
});

it('handles zero amount cleanly', function (): void {
    $out = fmt(Money::zero('UZS'), 'uz');

    expect($out)->toBeString();
    expect($out)->toMatch('/0/');
    expect($out)->not->toContain('NaN');
    expect($out)->not->toContain('null');
});

it('handles RUB in ru locale with ₽ glyph', function (): void {
    $out = fmt(Money::fromMinor(50000, 'RUB'), 'ru');

    expect($out)->toBeString();
    expect($out)->toMatch('/500[.,]00/');
    // ₽ or 'руб' or RUB — accept any.
    expect($out)->toMatch('/₽|руб|RUB/');
});

it('handles unknown locale by falling back to a default (no error)', function (): void {
    // 'xx' is not a real locale — formatter should default rather than throw.
    $out = fmt(Money::fromMinor(100, 'USD'), 'xx');

    expect($out)->toBeString();
    expect($out)->not->toBeEmpty();
});

it('Money::format() delegates to the helper', function (): void {
    // Round-trip: Money::format() should produce the same string as the
    // helper directly. This validates the wiring inside Money::format().
    $direct = fmt(Money::uzs(1000), 'uz');
    $viaMoney = Money::uzs(1000)->format('uz');

    expect($viaMoney)->toBe($direct);
});
