<?php

declare(strict_types=1);

namespace App\Filament\Widgets;

use App\Domain\AI\Enums\AiFeature;
use App\Domain\AI\Models\AiGenerationLog;
use App\Models\User;
use Carbon\CarbonImmutable;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * AI usage / cost dashboard widget.
 *
 * Renders four stats:
 *   - Today's calls + cost
 *   - This month's calls + cost
 *   - Average duration
 *   - Top feature (with %)
 *
 * Visibility: registered as a header widget on
 * {@see \App\Filament\Resources\AiGenerationLogResource\Pages\ListAiGenerationLogs}
 * and can be added to the Dashboard for super admins via
 * {@see \App\Providers\Filament\AdminPanelProvider}.
 *
 * Tenant scope:
 *   - Tenant admins see only their tenant's calls (BelongsToTenant scope on the
 *     model handles this transparently).
 *   - Super admins see global aggregates — `withoutGlobalScopes()` strips the
 *     scope for them.
 *
 * Cached for 60s per (tenant, day) bucket so a busy dashboard doesn't run the
 * same aggregations on every refresh.
 */
class AiCostWidget extends StatsOverviewWidget
{
    /**
     * No polling — the audit log is append-only and 60s cache is plenty fresh
     * for a cost dashboard. Page reload picks up new aggregates.
     */
    protected static ?string $pollingInterval = null;

    protected static ?int $sort = 1;

    /** @return array<int, Stat> */
    protected function getStats(): array
    {
        // The widget can be embedded on a page that loads before migrations
        // have applied (fresh installs / CI). Bail gracefully so the rest of
        // the page still renders.
        if (! Schema::hasTable('ai_generations_log')) {
            return [
                Stat::make(__('ai_studio.usage.widget.unavailable'), '—')
                    ->description(__('ai_studio.usage.widget.unavailable_help'))
                    ->color('gray'),
            ];
        }

        $now = CarbonImmutable::now();

        return [
            $this->todayStat($now),
            $this->monthStat($now),
            $this->avgDurationStat($now),
            $this->topFeatureStat($now),
        ];
    }

    private function todayStat(CarbonImmutable $now): Stat
    {
        $today = $now->startOfDay();
        $tomorrow = $today->addDay();

        $bucket = Cache::remember(
            $this->cacheKey('today', $today),
            60,
            fn (): array => [
                'count' => $this->query()
                    ->whereBetween('created_at', [$today, $tomorrow])
                    ->count(),
                'cost' => (float) $this->query()
                    ->whereBetween('created_at', [$today, $tomorrow])
                    ->sum('cost_usd'),
            ],
        );

        return Stat::make(
            __('ai_studio.usage.widget.today_title'),
            (string) $bucket['count'] . ' · $' . number_format($bucket['cost'], 2),
        )
            ->description(__('ai_studio.usage.widget.today_help'))
            ->descriptionIcon('heroicon-o-clock')
            ->color($bucket['count'] > 0 ? 'success' : 'gray');
    }

    private function monthStat(CarbonImmutable $now): Stat
    {
        $start = $now->startOfMonth();
        $next = $start->addMonth();

        $bucket = Cache::remember(
            $this->cacheKey('month', $start),
            300,
            fn (): array => [
                'count' => $this->query()
                    ->whereBetween('created_at', [$start, $next])
                    ->count(),
                'cost' => (float) $this->query()
                    ->whereBetween('created_at', [$start, $next])
                    ->sum('cost_usd'),
            ],
        );

        return Stat::make(
            __('ai_studio.usage.widget.month_title'),
            (string) $bucket['count'] . ' · $' . number_format($bucket['cost'], 2),
        )
            ->description(__('ai_studio.usage.widget.month_help'))
            ->descriptionIcon('heroicon-o-calendar')
            ->color('info');
    }

    private function avgDurationStat(CarbonImmutable $now): Stat
    {
        $start = $now->subDays(7);

        $avg = (float) Cache::remember(
            $this->cacheKey('avg_duration', $start),
            300,
            fn (): float => (float) $this->query()
                ->where('created_at', '>=', $start)
                ->where('status', 'success')
                ->avg('duration_ms'),
        );

        if ($avg <= 0) {
            return Stat::make(__('ai_studio.usage.widget.avg_duration_title'), '—')
                ->description(__('ai_studio.usage.widget.avg_duration_empty'))
                ->color('gray');
        }

        return Stat::make(
            __('ai_studio.usage.widget.avg_duration_title'),
            number_format($avg / 1000, 2) . ' s',
        )
            ->description(__('ai_studio.usage.widget.avg_duration_help'))
            ->descriptionIcon('heroicon-o-bolt')
            ->color($avg < 3000 ? 'success' : ($avg < 6000 ? 'warning' : 'danger'));
    }

    /**
     * Picks the most-used feature in the trailing 30 days and returns its
     * percentage share. Useful for spotting "translator dominates" or
     * "chatbot is taking off" trends without leaving the dashboard.
     */
    private function topFeatureStat(CarbonImmutable $now): Stat
    {
        $start = $now->subDays(30);

        $rows = Cache::remember(
            $this->cacheKey('top_feature', $start),
            300,
            fn (): array => $this->query()
                ->where('created_at', '>=', $start)
                ->selectRaw('feature, COUNT(*) AS cnt')
                ->groupBy('feature')
                ->orderByDesc('cnt')
                ->limit(5)
                ->get()
                ->map(static fn ($r) => [
                    'feature' => is_string($r->feature) ? $r->feature : ($r->feature?->value ?? '—'),
                    'count' => (int) $r->cnt,
                ])
                ->all(),
        );

        if ($rows === []) {
            return Stat::make(__('ai_studio.usage.widget.top_feature_title'), '—')
                ->description(__('ai_studio.usage.widget.top_feature_empty'))
                ->color('gray');
        }

        $total = array_sum(array_column($rows, 'count'));
        $top = $rows[0];
        $pct = $total > 0 ? (int) round($top['count'] / $total * 100) : 0;

        $label = AiFeature::tryFrom((string) $top['feature'])?->label() ?? (string) $top['feature'];

        return Stat::make(
            __('ai_studio.usage.widget.top_feature_title'),
            $label . " ({$pct}%)",
        )
            ->description(__('ai_studio.usage.widget.top_feature_help'))
            ->descriptionIcon('heroicon-o-star')
            ->color('primary');
    }

    /**
     * Build a tenant-scoped cache key so super-admin views don't leak
     * aggregates across tenant logins.
     */
    private function cacheKey(string $stat, CarbonImmutable $bucket): string
    {
        $user = auth()->user();
        $tenantKey = $user instanceof User ? ((string) ($user->tenant_id ?? 'global')) : 'guest';
        if ($user instanceof User && $user->is_super_admin === true) {
            $tenantKey = 'super_admin';
        }
        return sprintf(
            'widget:ai_cost:%s:%s:%s',
            $stat,
            $tenantKey,
            (string) $bucket->getTimestamp(),
        );
    }

    /**
     * Build the base query: super admins bypass the BelongsToTenant scope so
     * they see every tenant's calls; tenant admins get scoped automatically.
     *
     * @return Builder<AiGenerationLog>
     */
    private function query(): Builder
    {
        $user = auth()->user();
        $query = AiGenerationLog::query();

        if ($user instanceof User && $user->is_super_admin === true) {
            $query->withoutGlobalScopes();
        }

        return $query;
    }
}
