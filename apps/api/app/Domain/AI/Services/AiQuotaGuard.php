<?php

declare(strict_types=1);

namespace App\Domain\AI\Services;

use App\Domain\AI\Enums\AiGenerationStatus;
use App\Domain\AI\Exceptions\AiQuotaExceededException;
use App\Domain\AI\Models\AiGenerationLog;
use App\Domain\Tenant\Models\Tenant;

/**
 * Per-tenant AI quota enforcement.
 *
 * Counts successful + error rows in `ai_generations_log` for today (UTC) and
 * compares against `config('anthropic.daily_limits.<tier>')`. Errors count
 * because a misbehaving prompt that 500s repeatedly is still a cost driver
 * (Anthropic bills for failed generations once tokens are emitted) and an
 * abuse vector (loop detection).
 *
 * Limit semantics:
 *   - `0`     → AI features disabled for this tier (Free)
 *   - `null`  → unlimited (Enterprise)
 *   - `int N` → at most N requests per UTC day (Pro: 50, Plus: 500)
 *
 * Day boundary: UTC midnight. Same boundary used by the cost dashboard so
 * the numbers reconcile. (Tenants in UZT will see the counter reset 5h
 * before local midnight — acceptable trade-off versus per-tenant tz math.)
 */
final class AiQuotaGuard
{
    /**
     * Throws if the tenant has exhausted their daily allowance.
     */
    public function ensureWithinDailyLimit(Tenant $tenant): void
    {
        $tier = (string) ($tenant->tier ?? 'free');
        $limit = $this->dailyLimitFor($tier);

        if ($limit === null) {
            return; // Unlimited (Enterprise).
        }

        if ($limit <= 0) {
            throw new AiQuotaExceededException(
                usedToday: 0,
                dailyLimit: 0,
                tier: $tier,
            );
        }

        $used = $this->countUsedToday($tenant->id);
        if ($used >= $limit) {
            throw new AiQuotaExceededException(
                usedToday: $used,
                dailyLimit: $limit,
                tier: $tier,
            );
        }
    }

    /**
     * Returns a snapshot of the tenant's current month + day usage. Drives
     * the GET /admin/ai/usage endpoint.
     *
     * @return array{
     *     today: array{used: int, limit: int|null, remaining: int|null},
     *     month: array{requests: int, input_tokens: int, output_tokens: int, cost_usd: float, errors: int},
     *     tier: string
     * }
     */
    public function usageSnapshot(Tenant $tenant): array
    {
        $tier = (string) ($tenant->tier ?? 'free');
        $limit = $this->dailyLimitFor($tier);
        $usedToday = $this->countUsedToday($tenant->id);

        $monthRows = AiGenerationLog::query()
            ->where('tenant_id', $tenant->id)
            ->where('created_at', '>=', now()->startOfMonth())
            ->selectRaw('
                COUNT(*) as requests,
                COALESCE(SUM(input_tokens), 0) as input_tokens,
                COALESCE(SUM(output_tokens), 0) as output_tokens,
                COALESCE(SUM(cost_usd), 0) as cost_usd,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as errors
            ', [AiGenerationStatus::Error->value])
            ->first();

        return [
            'today' => [
                'used' => $usedToday,
                'limit' => $limit,
                'remaining' => $limit === null ? null : max(0, $limit - $usedToday),
            ],
            'month' => [
                'requests' => (int) ($monthRows->requests ?? 0),
                'input_tokens' => (int) ($monthRows->input_tokens ?? 0),
                'output_tokens' => (int) ($monthRows->output_tokens ?? 0),
                'cost_usd' => round((float) ($monthRows->cost_usd ?? 0), 6),
                'errors' => (int) ($monthRows->errors ?? 0),
            ],
            'tier' => $tier,
        ];
    }

    /**
     * Gate the unauthenticated public onboarding endpoint by IP. Returns the
     * count of public requests for the given IP in the last hour so callers
     * can decide whether to proceed.
     */
    public function countPublicRequestsByIpLastHour(string $ip): int
    {
        return AiGenerationLog::query()
            ->withoutGlobalScopes()
            ->whereNull('tenant_id')
            ->where('ip_address', $ip)
            ->where('created_at', '>=', now()->subHour())
            ->count();
    }

    /**
     * @return int|null  null = unlimited; 0 = disabled; positive int = cap.
     */
    private function dailyLimitFor(string $tier): ?int
    {
        $limits = (array) config('anthropic.daily_limits', []);
        $value = $limits[$tier] ?? 0;

        if ($value === null) {
            return null;
        }
        return (int) $value;
    }

    private function countUsedToday(string $tenantId): int
    {
        return AiGenerationLog::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->startOfDay())
            ->count();
    }
}
