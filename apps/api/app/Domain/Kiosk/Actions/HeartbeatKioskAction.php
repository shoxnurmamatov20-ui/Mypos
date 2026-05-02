<?php

declare(strict_types=1);

namespace App\Domain\Kiosk\Actions;

use App\Domain\Kiosk\Models\KioskDevice;

/**
 * Updates a kiosk device's liveness timestamp and merges any newly reported
 * device_info fields. Designed to be called every ~30s by the kiosk app.
 */
class HeartbeatKioskAction
{
    /**
     * @param  array{
     *     app_version?: string|null,
     *     battery_percent?: int|null,
     *     ip_address?: string|null,
     *     device_info?: array<string, mixed>|null,
     * }  $input
     */
    public function __invoke(KioskDevice $device, array $input): KioskDevice
    {
        $existing = $device->device_info ?? [];

        $patch = array_filter([
            'app_version' => $input['app_version'] ?? null,
            'battery_percent' => $input['battery_percent'] ?? null,
        ], static fn ($v): bool => $v !== null);

        if (! empty($input['device_info']) && is_array($input['device_info'])) {
            $patch = array_merge($patch, $input['device_info']);
        }

        $merged = array_merge($existing, $patch);

        $device->update([
            'last_seen_at' => now(),
            'last_ip_address' => $input['ip_address'] ?? $device->last_ip_address,
            'device_info' => $merged !== [] ? $merged : null,
        ]);

        return $device->fresh() ?? $device;
    }
}
