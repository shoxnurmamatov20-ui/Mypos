<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Services;

use App\Domain\SuperAdmin\Enums\SubscriptionStatus;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Support\Facades\DB;

class MrrBreakdownService
{
    /**
     * @return array<string, mixed>
     */
    public function compute(): array
    {
        return [
            'by_plan' => $this->byPlan(),
            'movement_30d' => $this->movement30d(),
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function byPlan(): array
    {
        return Tenant::query()
            ->withoutGlobalScopes()
            ->whereIn('subscription_status', [
                SubscriptionStatus::Active->value,
                SubscriptionStatus::Trialing->value,
                SubscriptionStatus::PastDue->value,
            ])
            ->select(
                'subscription_plan',
                DB::raw('COUNT(*) as tenants'),
                DB::raw('SUM(mrr_minor) as mrr_minor'),
            )
            ->groupBy('subscription_plan')
            ->orderBy('subscription_plan')
            ->get()
            ->map(fn ($r): array => [
                'plan' => (string) $r->subscription_plan,
                'tenants' => (int) $r->tenants,
                'mrr_minor' => (int) $r->mrr_minor,
            ])
            ->all();
    }

    /** @return array<string, int> */
    private function movement30d(): array
    {
        $cutoff = now()->copy()->subDays(30);

        // New MRR — tenants created within the last 30d that are paying
        $newMrr = (int) Tenant::query()
            ->withoutGlobalScopes()
            ->where('created_at', '>=', $cutoff)
            ->whereIn('subscription_status', [
                SubscriptionStatus::Active->value,
                SubscriptionStatus::Trialing->value,
            ])
            ->sum('mrr_minor');

        // Churn MRR — tenants that became cancelled/suspended in the last 30d
        // We use suspended_at / subscription_ends_at if set.
        $churnMrr = (int) Tenant::query()
            ->withoutGlobalScopes()
            ->where(function ($q) use ($cutoff): void {
                $q->where('subscription_status', SubscriptionStatus::Cancelled->value)
                    ->where('updated_at', '>=', $cutoff);
            })
            ->orWhere(function ($q) use ($cutoff): void {
                $q->where('subscription_status', SubscriptionStatus::Suspended->value)
                    ->where('suspended_at', '>=', $cutoff);
            })
            ->sum('mrr_minor');

        // Expansion MRR is harder to detect without history; default to 0.
        $expansionMrr = 0;

        return [
            'new_mrr' => $newMrr,
            'expansion_mrr' => $expansionMrr,
            'churn_mrr' => -$churnMrr,
            'net' => $newMrr + $expansionMrr - $churnMrr,
        ];
    }
}
