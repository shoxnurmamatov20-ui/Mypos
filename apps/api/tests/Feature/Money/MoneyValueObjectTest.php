<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| E7 — Phase 4 — Money value object
|--------------------------------------------------------------------------
|
| Spec covered (Agent E4 — `App\Domain\Shared\ValueObjects\Money`):
|   - Constructs from `int $minor` + ISO-4217 currency.
|   - Static factories: `Money::uzs($major)` (0-decimal), `Money::fromMinor()`,
|     `Money::fromMajor()`, `Money::zero()`.
|   - Arithmetic: add, subtract, multiply, allocate. All immutable, all
|     currency-checked.
|   - Comparison: equals, greaterThan(OrEqual), lessThan, isZero, isPositive.
|   - Formatting: toMajorString, toMajorFloat, toArray, jsonSerialize, format().
|   - Rejects negative minor amounts at construction.
|   - Rejects invalid ISO-4217 codes (anything not /^[A-Z]{3}$/).
|
| Pure unit-style tests — no DB, no HTTP. Run very fast.
*/

use App\Domain\Shared\ValueObjects\Money;

it('constructs from minor + currency', function (): void {
    $m = new Money(12500, 'UZS');
    expect($m->minor)->toBe(12500);
    expect($m->currency)->toBe('UZS');
});

it('UZS factory creates Money with 0 decimals', function (): void {
    $m = Money::uzs(45000);
    expect($m->minor)->toBe(45000);
    expect($m->currency)->toBe('UZS');
    expect(Money::decimalsFor('UZS'))->toBe(0);
});

it('fromMinor preserves minor units', function (): void {
    $m = Money::fromMinor(1500, 'USD');
    expect($m->minor)->toBe(1500);
    expect($m->currency)->toBe('USD');
});

it('fromMinor uppercases the currency code', function (): void {
    $m = Money::fromMinor(1000, 'usd');
    expect($m->currency)->toBe('USD');
});

it('fromMajor handles 2-decimal currencies (USD)', function (): void {
    $m = Money::fromMajor('15.00', 'USD');
    expect($m->minor)->toBe(1500);
});

it('fromMajor handles 0-decimal currencies (UZS)', function (): void {
    $m = Money::fromMajor('45000', 'UZS');
    expect($m->minor)->toBe(45000);
});

it('fromMajor accepts comma as decimal separator (RU/UZ locales)', function (): void {
    $m = Money::fromMajor('15,50', 'USD');
    expect($m->minor)->toBe(1550);
});

it('fromMajor rejects malformed input', function (): void {
    expect(fn () => Money::fromMajor('not a number', 'USD'))
        ->toThrow(InvalidArgumentException::class);
});

it('add requires same currency — throws on mismatch', function (): void {
    $uzs = Money::uzs(1000);
    $kzt = Money::fromMinor(1000, 'KZT');

    expect(fn () => $uzs->add($kzt))->toThrow(InvalidArgumentException::class);
});

it('add returns new Money (immutability)', function (): void {
    $a = Money::uzs(1000);
    $b = Money::uzs(500);
    $sum = $a->add($b);

    expect($sum->minor)->toBe(1500);
    // Original untouched.
    expect($a->minor)->toBe(1000);
    expect($b->minor)->toBe(500);
    expect($sum)->not->toBe($a);
});

it('subtract requires same currency — throws on mismatch', function (): void {
    $uzs = Money::uzs(1000);
    $usd = Money::fromMinor(100, 'USD');

    expect(fn () => $uzs->subtract($usd))->toThrow(InvalidArgumentException::class);
});

it('subtract throws when result would be negative', function (): void {
    $small = Money::uzs(100);
    $big = Money::uzs(500);

    expect(fn () => $small->subtract($big))->toThrow(InvalidArgumentException::class);
});

it('subtract works for non-negative result', function (): void {
    $diff = Money::uzs(1000)->subtract(Money::uzs(300));
    expect($diff->minor)->toBe(700);
});

it('multiply by float — banker\'s rounding', function (): void {
    $m = Money::uzs(1000)->multiply(1.5);
    expect($m->minor)->toBe(1500);

    // 0.5 with banker's rounding → 0 (half-to-even).
    $halfRound = Money::uzs(1)->multiply(0.5);
    expect($halfRound->minor)->toBe(0);
});

it('multiply rejects negative factor', function (): void {
    $m = Money::uzs(1000);
    expect(fn () => $m->multiply(-1.0))->toThrow(InvalidArgumentException::class);
});

it('allocate distributes minor across N parts', function (): void {
    $parts = Money::uzs(100)->allocate(3);
    expect($parts)->toHaveCount(3);

    $sum = array_sum(array_map(static fn (Money $p) => $p->minor, $parts));
    expect($sum)->toBe(100); // total preserved

    // Leading bucket gets the remainder.
    expect($parts[0]->minor)->toBe(34);
    expect($parts[1]->minor)->toBe(33);
    expect($parts[2]->minor)->toBe(33);
});

it('allocate rejects zero/negative parts', function (): void {
    $m = Money::uzs(100);
    expect(fn () => $m->allocate(0))->toThrow(InvalidArgumentException::class);
    expect(fn () => $m->allocate(-1))->toThrow(InvalidArgumentException::class);
});

it('equals compares both minor and currency', function (): void {
    expect(Money::uzs(1000)->equals(Money::uzs(1000)))->toBeTrue();
    expect(Money::uzs(1000)->equals(Money::uzs(2000)))->toBeFalse();
    expect(Money::uzs(1000)->equals(Money::fromMinor(1000, 'KZT')))->toBeFalse();
});

it('greaterThan / lessThan / greaterThanOrEqual', function (): void {
    $small = Money::uzs(100);
    $big = Money::uzs(200);

    expect($big->greaterThan($small))->toBeTrue();
    expect($small->lessThan($big))->toBeTrue();
    expect($big->greaterThanOrEqual($big))->toBeTrue();
    expect($small->greaterThanOrEqual($big))->toBeFalse();
});

it('comparison ops throw on currency mismatch', function (): void {
    $uzs = Money::uzs(100);
    $usd = Money::fromMinor(100, 'USD');

    expect(fn () => $uzs->greaterThan($usd))->toThrow(InvalidArgumentException::class);
    expect(fn () => $uzs->lessThan($usd))->toThrow(InvalidArgumentException::class);
});

it('isZero / isPositive helpers', function (): void {
    expect(Money::zero('UZS')->isZero())->toBeTrue();
    expect(Money::uzs(0)->isZero())->toBeTrue();
    expect(Money::uzs(1)->isZero())->toBeFalse();

    expect(Money::uzs(1)->isPositive())->toBeTrue();
    expect(Money::zero('UZS')->isPositive())->toBeFalse();
});

it('toMajorString — UZS has no decimals', function (): void {
    expect(Money::uzs(45000)->toMajorString())->toBe('45000');
});

it('toMajorString — USD has 2 decimals', function (): void {
    expect(Money::fromMinor(1500, 'USD')->toMajorString())->toBe('15.00');
});

it('toMajorString — KZT has 2 decimals', function (): void {
    expect(Money::fromMinor(35075, 'KZT')->toMajorString())->toBe('350.75');
});

it('toArray serialization shape', function (): void {
    $arr = Money::fromMinor(1500, 'USD')->toArray();

    expect($arr)->toHaveKeys(['minor', 'currency', 'decimals', 'major']);
    expect($arr['minor'])->toBe(1500);
    expect($arr['currency'])->toBe('USD');
    expect($arr['decimals'])->toBe(2);
    expect($arr['major'])->toBe('15.00');
});

it('jsonSerialize matches toArray', function (): void {
    $m = Money::uzs(1000);
    expect(json_encode($m))->toBe(json_encode($m->toArray()));
});

it('rejects negative minor at construction', function (): void {
    expect(fn () => new Money(-1, 'UZS'))->toThrow(InvalidArgumentException::class);
});

it('rejects invalid ISO 4217 currency code', function (): void {
    expect(fn () => new Money(100, 'usd'))->toThrow(InvalidArgumentException::class); // lowercase
    expect(fn () => new Money(100, 'US'))->toThrow(InvalidArgumentException::class);  // 2 chars
    expect(fn () => new Money(100, 'USDD'))->toThrow(InvalidArgumentException::class); // 4 chars
    expect(fn () => new Money(100, '123'))->toThrow(InvalidArgumentException::class);  // digits
});

it('__toString returns "<major> <currency>"', function (): void {
    expect((string) Money::uzs(1000))->toBe('1000 UZS');
    expect((string) Money::fromMinor(1500, 'USD'))->toBe('15.00 USD');
});

it('zero produces a Money with 0 minor', function (): void {
    $z = Money::zero('UZS');
    expect($z->minor)->toBe(0);
    expect($z->currency)->toBe('UZS');
    expect($z->isZero())->toBeTrue();
});

it('decimalsFor returns expected values for known currencies', function (): void {
    expect(Money::decimalsFor('UZS'))->toBe(0);
    expect(Money::decimalsFor('USD'))->toBe(2);
    expect(Money::decimalsFor('KZT'))->toBe(2);
    expect(Money::decimalsFor('KGS'))->toBe(2);
    expect(Money::decimalsFor('TJS'))->toBe(2);
    expect(Money::decimalsFor('RUB'))->toBe(2);
    expect(Money::decimalsFor('JPY'))->toBe(0);
    // Unknown currency falls back to 2.
    expect(Money::decimalsFor('XXX'))->toBe(2);
});
