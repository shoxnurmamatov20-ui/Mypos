<?php

declare(strict_types=1);

namespace App\Models\Observers;

use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Reacts to security-sensitive changes on the User model.
 *
 * Currently:
 * - Revokes ALL Sanctum tokens when `is_super_admin` is toggled (in either
 *   direction). This forces re-authentication so a token minted while the user
 *   was a tenant member cannot continue to be presented after a (mis-)elevation,
 *   and a token minted as super-admin cannot continue to be presented after
 *   demotion.
 * - Logs the event at warning level so SOC tooling can correlate with
 *   `super_admin.elevation` audit entries.
 */
class UserSecurityObserver
{
    public function updating(User $user): void
    {
        if (! $user->isDirty('is_super_admin')) {
            return;
        }

        $oldValue = (bool) $user->getOriginal('is_super_admin');
        $newValue = (bool) $user->is_super_admin;

        // No-op if the cast resolved to the same value (e.g. 0 vs false).
        if ($oldValue === $newValue) {
            return;
        }

        // Revoke every Sanctum personal access token for this user. The user
        // will be forced to re-authenticate; new tokens will be minted with
        // abilities matching the user's *current* status (tenant or super-admin).
        $user->tokens()->delete();

        Log::warning('All Sanctum tokens revoked due to is_super_admin change', [
            'user_id' => $user->id,
            'user_uuid' => $user->uuid,
            'email' => $user->email,
            'old_is_super_admin' => $oldValue,
            'new_is_super_admin' => $newValue,
        ]);
    }
}
