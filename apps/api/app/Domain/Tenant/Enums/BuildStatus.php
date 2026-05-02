<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Enums;

/**
 * Phase 3 — status of a single EAS Build attempt
 * ({@see \App\Domain\Tenant\Models\TenantAppBuild}).
 *
 * Mirrors the EAS Build API's `status` field
 * (https://docs.expo.dev/build-reference/build-process/), with
 * `Queued` representing both "in our queue waiting to call EAS" and
 * "EAS has accepted but not started yet" — we collapse the two so the
 * dashboard surface stays simple.
 *
 * Terminal states: Finished, Failed, Errored, Canceled.
 */
enum BuildStatus: string
{
    case Queued = 'queued';
    // Hyphenated to match the column docstring on
    // `2026_06_01_000002_create_tenant_app_builds_table.php` (D1).
    case InProgress = 'in-progress';
    case Finished = 'finished';
    case Failed = 'failed';
    case Errored = 'errored';
    case Canceled = 'canceled';

    public function label(): string
    {
        return match ($this) {
            self::Queued => 'Queued',
            self::InProgress => 'In progress',
            self::Finished => 'Finished',
            self::Failed => 'Failed',
            self::Errored => 'Errored',
            self::Canceled => 'Canceled',
        };
    }

    public function isTerminal(): bool
    {
        return match ($this) {
            self::Finished, self::Failed, self::Errored, self::Canceled => true,
            self::Queued, self::InProgress => false,
        };
    }

    /**
     * Translate an EAS-side status string into our local enum. EAS uses
     * `new` and `pending` for pre-start, both of which we collapse onto
     * `Queued`. Unknown values fall back to `Errored` so we never silently
     * swallow a state we don't understand.
     */
    public static function fromEas(?string $value): self
    {
        return match (strtolower((string) $value)) {
            'new', 'pending', 'queued' => self::Queued,
            'in-queue', 'in_queue', 'in-progress', 'in_progress' => self::InProgress,
            'finished' => self::Finished,
            'failed' => self::Failed,
            'errored' => self::Errored,
            'canceled', 'cancelled' => self::Canceled,
            default => self::Errored,
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(fn (self $s): string => $s->value, self::cases());
    }
}
