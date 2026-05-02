<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Domain\SuperAdmin\Enums\AuditSeverity;
use App\Domain\SuperAdmin\Services\AuditLogger;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\SuperAdmin\UpdateSettingsRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Platform-wide settings stored in cache (no migration yet for platform_settings).
 * Persists indefinitely via Cache::forever() — survives Redis restarts only via
 * persistent driver. Fine for v1; replace with PlatformSetting model when ready.
 */
class SettingsController extends Controller
{
    private const CACHE_KEY = 'platform_settings';

    public function show(): JsonResponse
    {
        return response()->json([
            'data' => $this->load(),
        ]);
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $current = $this->load();
        $incoming = (array) $request->input('settings', []);
        $merged = array_replace_recursive($current, $incoming);

        Cache::forever(self::CACHE_KEY, $merged);

        AuditLogger::log('platform.settings_updated', [
            'actor_user' => $request->user(),
            'subject_type' => 'platform_setting',
            'subject_label' => 'platform_settings',
            'severity' => AuditSeverity::Info->value,
            'metadata' => ['changed_keys' => array_keys($incoming)],
        ]);

        return response()->json(['data' => $merged]);
    }

    /**
     * @return array<string, mixed>
     */
    private function load(): array
    {
        $defaults = [
            'feature_flags' => [
                'kiosk' => true,
                'qr_menu' => true,
                'courier' => true,
                'loyalty' => true,
                'inventory' => true,
            ],
            'default_plan' => 'starter',
            'default_trial_days' => 14,
            'default_locale' => 'uz',
            'default_currency' => 'UZS',
            'default_timezone' => 'Asia/Tashkent',
            'maintenance_mode' => false,
            'allow_signups' => true,
        ];

        $stored = Cache::get(self::CACHE_KEY, []);
        return array_replace_recursive($defaults, is_array($stored) ? $stored : []);
    }
}
