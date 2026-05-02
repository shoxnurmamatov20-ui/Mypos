<?php

declare(strict_types=1);

namespace App\Domain\Kiosk\Actions;

use App\Domain\Kiosk\Enums\KioskDeviceStatus;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Kiosk\Models\KioskPairingCode;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Exchanges a valid pairing code for a brand-new {@see KioskDevice} record
 * plus its plaintext device token (returned exactly once).
 *
 * Tokens are SHA-256 hashed at rest so the unique index on
 * `device_token_hash` can resolve them in O(log n) on every request.
 */
class PairKioskDeviceAction
{
    /**
     * @param  array{
     *     code: string,
     *     device_name: string,
     *     device_info?: array<string, mixed>|null,
     *     ip_address?: string|null,
     * }  $input
     * @return array{device: KioskDevice, plain_token: string}
     */
    public function __invoke(array $input): array
    {
        $code = $input['code'];

        // Pairing code lookup ignores the tenant scope because no user is
        // authenticated at this point — the code itself selects the tenant.
        $pairing = KioskPairingCode::query()
            ->withoutGlobalScopes(['tenant'])
            ->where('code', $code)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('created_at')
            ->first();

        if ($pairing === null) {
            throw ValidationException::withMessages([
                'code' => [__('Bog\'lash kodi noto\'g\'ri yoki muddati o\'tgan')],
            ]);
        }

        return DB::transaction(function () use ($pairing, $input): array {
            $plainToken = Str::random(64);
            $hash = KioskDevice::hashToken($plainToken);

            $device = KioskDevice::query()->create([
                'tenant_id' => $pairing->tenant_id,
                'name' => mb_substr($input['device_name'], 0, 64),
                'device_token_hash' => $hash,
                'device_token_last4' => substr($plainToken, -4),
                'device_info' => $input['device_info'] ?? null,
                'paired_at' => now(),
                'last_seen_at' => now(),
                'last_ip_address' => $input['ip_address'] ?? null,
                'status' => KioskDeviceStatus::Paired->value,
            ]);

            $pairing->update([
                'consumed_at' => now(),
                'device_id' => $device->id,
            ]);

            return [
                'device' => $device->fresh(),
                'plain_token' => $plainToken,
            ];
        });
    }
}
