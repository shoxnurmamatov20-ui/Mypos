<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Enums;

/**
 * Phase 3 — high-level lifecycle of a {@see \App\Domain\Tenant\Models\TenantApp}.
 *
 * State machine (managed by Agent D2/D3 actions + store webhooks):
 *
 *   Draft ──► Configuring ──► Building ──► Review ──► Live
 *                                              │       │
 *                                              ▼       ▼
 *                                          Rejected  Paused
 *                                              │
 *                                              └─► Configuring (resubmit)
 *
 * String values match the `status` column on `tenant_apps`.
 */
enum AppStatus: string
{
    case Draft = 'draft';
    case Configuring = 'configuring';
    case Building = 'building';
    case Review = 'review';
    case Live = 'live';
    case Rejected = 'rejected';
    case Paused = 'paused';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Configuring => 'Configuring',
            self::Building => 'Building',
            self::Review => 'In Review',
            self::Live => 'Live',
            self::Rejected => 'Rejected',
            self::Paused => 'Paused',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(fn (self $s): string => $s->value, self::cases());
    }
}
