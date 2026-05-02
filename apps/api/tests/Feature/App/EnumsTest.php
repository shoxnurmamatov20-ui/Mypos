<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| D7 — Phase 3 — App enum invariants
|--------------------------------------------------------------------------
|
| Spec covered (Agent D1):
|   - AppPlatform   — ios | android | universal (EAS dispatches use `all`
|     for universal — `easValue()` handles the mapping).
|   - AppStatus     — high-level lifecycle states for a TenantApp row.
|   - BuildStatus   — mirrors EAS Build API states + helpful introspection
|                     (`isTerminal`, `fromEas` for webhook ingest).
|   - SubmissionStatus — Apple/Google review lifecycle.
|
| These are pure enum cases — no DB, no HTTP, no infrastructure. They lock
| down the wire format MyPOS expects from EAS so a future agent can't
| accidentally drop or rename a case.
*/

use App\Domain\Tenant\Enums\AppPlatform;
use App\Domain\Tenant\Enums\AppStatus;
use App\Domain\Tenant\Enums\BuildStatus;
use App\Domain\Tenant\Enums\SubmissionStatus;

it('AppPlatform exposes ios, android, universal cases with stable string values', function (): void {
    $values = AppPlatform::values();

    expect($values)->toContain('ios');
    expect($values)->toContain('android');
    expect($values)->toContain('universal');
    expect(AppPlatform::Ios->value)->toBe('ios');
    expect(AppPlatform::Android->value)->toBe('android');
    expect(AppPlatform::Universal->value)->toBe('universal');
});

it('AppPlatform::easValue() maps universal -> "all" for the EAS Build API', function (): void {
    expect(AppPlatform::Ios->easValue())->toBe('ios');
    expect(AppPlatform::Android->easValue())->toBe('android');
    // EAS uses `all` for cross-platform builds — matching the wire format.
    expect(AppPlatform::Universal->easValue())->toBe('all');
});

it('AppPlatform::cases() returns exactly the three known values', function (): void {
    $cases = AppPlatform::cases();
    expect($cases)->toHaveCount(3);
});

it('AppStatus has the expected lifecycle states', function (): void {
    $values = AppStatus::values();

    foreach (['draft', 'configuring', 'building', 'review', 'live', 'rejected', 'paused'] as $expected) {
        expect(in_array($expected, $values, true))->toBeTrue("AppStatus is missing case `{$expected}`");
    }
});

it('AppStatus exposes a label for every case', function (): void {
    foreach (AppStatus::cases() as $case) {
        expect($case->label())->toBeString()->not->toBe('');
    }
});

it('BuildStatus matches EAS API values and exposes terminal-state introspection', function (): void {
    $values = BuildStatus::values();

    // 'in-progress' (hyphen) matches EAS API wire format, not 'in_progress'.
    foreach (['queued', 'in-progress', 'finished', 'failed', 'errored', 'canceled'] as $expected) {
        expect(in_array($expected, $values, true))->toBeTrue("BuildStatus is missing case `{$expected}`");
    }

    // Terminal vs in-flight classification used by Filament + dashboard.
    expect(BuildStatus::Finished->isTerminal())->toBeTrue();
    expect(BuildStatus::Failed->isTerminal())->toBeTrue();
    expect(BuildStatus::Errored->isTerminal())->toBeTrue();
    expect(BuildStatus::Canceled->isTerminal())->toBeTrue();
    expect(BuildStatus::Queued->isTerminal())->toBeFalse();
    expect(BuildStatus::InProgress->isTerminal())->toBeFalse();
});

it('BuildStatus::fromEas() coerces EAS wire values to local cases', function (): void {
    // EAS uses several variants for queued / in-progress; we collapse them.
    expect(BuildStatus::fromEas('new'))->toBe(BuildStatus::Queued);
    expect(BuildStatus::fromEas('pending'))->toBe(BuildStatus::Queued);
    expect(BuildStatus::fromEas('in-progress'))->toBe(BuildStatus::InProgress);
    expect(BuildStatus::fromEas('in_progress'))->toBe(BuildStatus::InProgress);
    expect(BuildStatus::fromEas('finished'))->toBe(BuildStatus::Finished);
    expect(BuildStatus::fromEas('failed'))->toBe(BuildStatus::Failed);
    expect(BuildStatus::fromEas('errored'))->toBe(BuildStatus::Errored);
    // British vs American spelling — both valid.
    expect(BuildStatus::fromEas('canceled'))->toBe(BuildStatus::Canceled);
    expect(BuildStatus::fromEas('cancelled'))->toBe(BuildStatus::Canceled);
});

it('BuildStatus::fromEas() falls back to Errored for unknown values', function (): void {
    // We must never silently swallow an unknown EAS status — better to
    // surface it as an error than leave a row in queued forever.
    expect(BuildStatus::fromEas('unknown_value'))->toBe(BuildStatus::Errored);
    expect(BuildStatus::fromEas(null))->toBe(BuildStatus::Errored);
    expect(BuildStatus::fromEas(''))->toBe(BuildStatus::Errored);
});

it('SubmissionStatus has the store-relevant states', function (): void {
    $values = SubmissionStatus::values();

    foreach (['pending', 'submitted', 'in_review', 'approved', 'rejected'] as $expected) {
        expect(in_array($expected, $values, true))->toBeTrue("SubmissionStatus is missing case `{$expected}`");
    }
});

it('every case enum exposes ::cases() with the documented count', function (): void {
    expect(AppPlatform::cases())->toHaveCount(3);
    expect(AppStatus::cases())->toHaveCount(7);
    expect(BuildStatus::cases())->toHaveCount(6);
    expect(SubmissionStatus::cases())->toHaveCount(5);
});
