<?php

declare(strict_types=1);

namespace App\Domain\AI\Actions;

use App\Domain\AI\Contracts\AnthropicClientContract;
use App\Domain\AI\Enums\AiFeature;
use App\Domain\AI\Services\DemandForecastService;
use App\Domain\Tenant\Models\Tenant;

/**
 * Phase-4 — Enterprise-tier narrative insights.
 *
 * Feeds the statistical output of {@see DemandForecastService} into Claude
 * and asks for actionable plain-language commentary. The model returns a
 * structured JSON document `{ insights, recommendations, risks }` that the
 * dashboard renders as three stacked panels.
 *
 * The action does NOT enforce the tier gate itself — that's the FormRequest
 * layer's job (`InsightsRequest`). This keeps the action reusable from
 * Filament + queued jobs without duplicating the gate.
 *
 * Cost: roughly 1500 input tokens + 800 output tokens per call. The
 * AnthropicClient (Agent E2) writes a row to `ai_generations_log` with
 * `usage_type = 'insights'` for billing reconciliation.
 */
final class AnalyzeRestaurantInsightsAction
{
    public function __construct(
        private readonly AnthropicClientContract $ai,
        private readonly DemandForecastService $forecast,
    ) {
    }

    /**
     * @return array{
     *     insights: list<string>,
     *     recommendations: list<string>,
     *     risks: list<string>,
     *     generated_at: string,
     *     usage: array<string, mixed>,
     * }
     */
    public function __invoke(Tenant $tenant, string $locale = 'uz'): array
    {
        $top = $this->forecast->topItemsForRestaurant($tenant, 30);
        $low = $this->forecast->lowSellersToRetire($tenant, 60);
        $next = $this->forecast->predictNextWeek($tenant);

        $context = $this->compactContext($tenant, $top, $low, $next);

        $localeName = match ($locale) {
            'ru' => 'Russian',
            'en' => 'English',
            default => 'Uzbek',
        };

        $systemPrompt = "You are a senior restaurant business analyst for "
            . $tenant->name
            . " (a restaurant in Central Asia). Read the JSON statistics and produce actionable commentary."
            . " Reply ONLY with valid JSON in this exact shape:\n"
            . '{ "insights": ["..."], "recommendations": ["..."], "risks": ["..."] }' . "\n"
            . "Each array should contain 3-5 short bullet points. Write in " . $localeName . "."
            . " Keep each bullet under 200 characters. Be specific — reference actual item names from the data."
            . " Do not include any text outside the JSON.";

        // Reuse the DemandForecast feature key so the row in
        // ai_generations_log is groupable with the other forecast surfaces
        // (the AiFeature enum doesn't currently distinguish narrative
        // insights from the underlying statistical job — this is intentional
        // for billing aggregation; if a finer split is needed later we add a
        // case to the enum and update both this action and the dashboards).
        $response = $this->ai->message(
            feature: AiFeature::DemandForecast,
            systemPrompt: $systemPrompt,
            userMessage: $context,
            maxTokens: 2048,
        );

        $parsed = $this->extractJson($response);
        $usage = is_array($response['usage'] ?? null) ? $response['usage'] : [];

        return [
            'insights' => $this->stringList($parsed['insights'] ?? []),
            'recommendations' => $this->stringList($parsed['recommendations'] ?? []),
            'risks' => $this->stringList($parsed['risks'] ?? []),
            'generated_at' => now()->toIso8601String(),
            'usage' => $usage,
        ];
    }

    /**
     * Build a compact JSON-encoded context string. We intentionally drop
     * verbose fields (per-hour buckets, encrypted PII) to keep tokens low.
     *
     * @param  list<array<string, mixed>>  $top
     * @param  list<array<string, mixed>>  $low
     * @param  list<array<string, mixed>>  $next
     */
    private function compactContext(Tenant $tenant, array $top, array $low, array $next): string
    {
        $context = [
            'restaurant' => [
                'name' => $tenant->name,
                'currency' => $tenant->default_currency,
                'timezone' => $tenant->timezone,
            ],
            'top_items_30d' => array_map(static fn ($row) => [
                'name' => $row['name'] ?? '',
                'order_count' => $row['order_count'] ?? 0,
                'total_qty' => $row['total_qty'] ?? 0,
                'peak_dow' => $row['peak_dow'] ?? null,
                'peak_hour' => $row['peak_hour'] ?? null,
            ], array_slice($top, 0, 15)),
            'low_sellers_60d' => array_map(static fn ($row) => [
                'name' => $row['name'] ?? '',
                'total_qty' => $row['total_qty'] ?? 0,
                'last_ordered_at' => $row['last_ordered_at'] ?? null,
            ], array_slice($low, 0, 10)),
            'predicted_next_week' => array_map(static fn ($row) => [
                'name' => $row['name'] ?? '',
                'predicted_qty' => $row['predicted_qty_next_week'] ?? 0,
                'confidence' => $row['confidence'] ?? 0.0,
            ], array_slice($next, 0, 10)),
        ];

        $encoded = json_encode($context, JSON_UNESCAPED_UNICODE);
        return $encoded === false ? '{}' : $encoded;
    }

    /**
     * Pull the JSON document out of the Messages API response.
     *
     * Claude is asked to return JSON-only but real-world responses sometimes
     * include leading/trailing prose. We extract the first balanced JSON
     * object found in the response text.
     *
     * @param  array<string, mixed>  $response
     * @return array<string, mixed>
     */
    private function extractJson(array $response): array
    {
        $text = $this->extractText($response);
        if ($text === '') {
            return [];
        }

        // Trim to the first `{ … }` block.
        $start = strpos($text, '{');
        $end = strrpos($text, '}');
        if ($start === false || $end === false || $end <= $start) {
            return [];
        }
        $candidate = substr($text, $start, $end - $start + 1);

        $decoded = json_decode($candidate, true);
        return is_array($decoded) ? $decoded : [];
    }

    /** @param array<string, mixed> $response */
    private function extractText(array $response): string
    {
        $content = $response['content'] ?? null;
        if (is_array($content) && isset($content[0]) && is_array($content[0])) {
            $first = $content[0];
            if (isset($first['text']) && is_string($first['text'])) {
                return $first['text'];
            }
        }
        return '';
    }

    /**
     * Coerce an arbitrary value into a list-of-strings, dropping non-strings
     * and items longer than 500 chars (defence against runaway model output).
     *
     * @param  mixed  $value
     * @return list<string>
     */
    private function stringList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $out = [];
        foreach ($value as $entry) {
            if (! is_string($entry)) {
                continue;
            }
            $clean = trim($entry);
            if ($clean === '') {
                continue;
            }
            $out[] = mb_substr($clean, 0, 500);
            if (count($out) >= 5) {
                break;
            }
        }
        return $out;
    }
}
