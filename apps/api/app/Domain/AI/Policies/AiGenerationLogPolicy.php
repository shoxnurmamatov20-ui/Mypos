<?php

declare(strict_types=1);

namespace App\Domain\AI\Policies;

use App\Domain\AI\Models\AiGenerationLog;
use App\Domain\Auth\Enums\Role;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Authorization for the AI generation audit log rows.
 *
 * The log table is read-only from the application surface — Filament's
 * super-admin panel views the rows for cost analytics, and tenant owners
 * can introspect their own usage via `GET /api/v1/admin/ai/usage` (which
 * goes through the aggregation service, not direct row reads).
 *
 * This policy exists so:
 *   - Future tenant-side log browsing (debugging) requires Owner role.
 *   - Super-admin dashboards have an explicit allow-rule rather than
 *     bypassing Gate.
 *   - Update / delete are blocked entirely (audit table is append-only).
 */
class AiGenerationLogPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null
            && $user->hasRole(Role::Owner->value);
    }

    public function view(User $user, AiGenerationLog $log): bool
    {
        if ($user->is_super_admin === true) {
            return true;
        }
        return $user->tenant_id !== null
            && $user->tenant_id === $log->tenant_id
            && $user->hasRole(Role::Owner->value);
    }

    /** Audit rows are immutable. */
    public function update(User $user, AiGenerationLog $log): bool
    {
        return false;
    }

    public function delete(User $user, AiGenerationLog $log): bool
    {
        return false;
    }

    /**
     * Trigger a new AI call. Owner + Manager — kitchen staff can ask Claude
     * to draft a description but cannot configure the menu generator.
     */
    public function create(User $user): bool
    {
        return $user->tenant_id !== null
            && $user->hasAnyRole([Role::Owner->value, Role::Manager->value]);
    }
}
