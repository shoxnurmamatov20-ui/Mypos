<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Services;

use App\Domain\SuperAdmin\Enums\AuditActorType;
use App\Domain\SuperAdmin\Enums\AuditSeverity;
use App\Domain\SuperAdmin\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

/**
 * Helper to write audit log entries. Append-only — entries are never updated.
 * Safe to call from anywhere (controllers, actions, listeners, jobs).
 */
class AuditLogger
{
    /**
     * @param array{
     *   tenant_id?: string|null,
     *   actor_user?: User|null,
     *   actor_type?: string|null,
     *   actor_label?: string|null,
     *   subject_type?: string|null,
     *   subject_id?: string|null,
     *   subject_label?: string|null,
     *   severity?: string|null,
     *   ip_address?: string|null,
     *   user_agent?: string|null,
     *   metadata?: array<string, mixed>|null,
     * } $context
     */
    public static function log(string $action, array $context = []): AuditLog
    {
        $actor = $context['actor_user'] ?? Auth::user();
        $request = request();
        $ip = $context['ip_address'] ?? $request?->ip();
        $userAgent = $context['user_agent'] ?? substr((string) ($request?->userAgent() ?? ''), 0, 512);

        $actorType = $context['actor_type']
            ?? self::resolveActorType($actor);

        $actorLabel = $context['actor_label']
            ?? ($actor instanceof User ? ($actor->email ?? $actor->name) : null);

        return AuditLog::create([
            'tenant_id' => $context['tenant_id']
                ?? ($actor instanceof User ? $actor->tenant_id : null),
            'actor_user_uuid' => $actor instanceof User ? $actor->uuid : null,
            'actor_type' => $actorType,
            'actor_label' => $actorLabel,
            'action' => $action,
            'subject_type' => $context['subject_type'] ?? null,
            'subject_id' => $context['subject_id'] ?? null,
            'subject_label' => $context['subject_label'] ?? null,
            'severity' => $context['severity'] ?? AuditSeverity::Info->value,
            'ip_address' => $ip,
            'user_agent' => $userAgent !== '' ? $userAgent : null,
            'metadata' => $context['metadata'] ?? null,
            'created_at' => now(),
        ]);
    }

    private static function resolveActorType(mixed $actor): string
    {
        if ($actor instanceof User) {
            return $actor->is_super_admin
                ? AuditActorType::SuperAdmin->value
                : AuditActorType::User->value;
        }
        return AuditActorType::System->value;
    }
}
