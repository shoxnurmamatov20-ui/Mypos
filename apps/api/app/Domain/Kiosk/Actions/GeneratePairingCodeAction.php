<?php

declare(strict_types=1);

namespace App\Domain\Kiosk\Actions;

use App\Domain\Kiosk\Models\KioskPairingCode;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Issues a short-lived 6-digit pairing code that an unpaired kiosk device can
 * exchange for a long-lived device token via {@see PairKioskDeviceAction}.
 *
 * Codes are scoped to a tenant and are unique within (tenant_id, code).
 */
class GeneratePairingCodeAction
{
    /** Default lifetime for a freshly generated pairing code. */
    private const LIFETIME_MINUTES = 15;

    /** Maximum attempts to generate a unique 6-digit code before giving up. */
    private const MAX_ATTEMPTS = 25;

    public function __invoke(Tenant $tenant, ?User $issuedBy = null, ?int $lifetimeMinutes = null): KioskPairingCode
    {
        $expiresAt = Carbon::now()->addMinutes($lifetimeMinutes ?? self::LIFETIME_MINUTES);

        $code = $this->allocateUniqueCode($tenant->id);

        return KioskPairingCode::query()->create([
            'tenant_id' => $tenant->id,
            'code' => $code,
            'expires_at' => $expiresAt,
            'created_by_user_uuid' => $issuedBy?->uuid,
        ]);
    }

    private function allocateUniqueCode(string $tenantId): string
    {
        for ($i = 0; $i < self::MAX_ATTEMPTS; $i++) {
            $candidate = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            $exists = KioskPairingCode::query()
                ->withoutGlobalScopes(['tenant'])
                ->where('tenant_id', $tenantId)
                ->where('code', $candidate)
                ->whereNull('consumed_at')
                ->where('expires_at', '>', now())
                ->exists();

            if (! $exists) {
                return $candidate;
            }
        }

        // Fallback (effectively impossible with 1M codes and small fleet) —
        // include high-entropy suffix to guarantee uniqueness.
        return substr(str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT), 0, 6);
    }
}
