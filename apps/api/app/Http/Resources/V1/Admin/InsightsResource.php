<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Phase-4 — wraps the JSON document returned by
 * {@see \App\Domain\AI\Actions\AnalyzeRestaurantInsightsAction}.
 *
 * Exposes the three narrative sections plus token-usage metadata so the
 * dashboard can surface "how many tokens did this analysis cost".
 */
class InsightsResource extends JsonResource
{
    /** @param array<string, mixed> $resource */
    public function __construct(array $resource)
    {
        parent::__construct($resource);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $row = (array) $this->resource;
        $usage = is_array($row['usage'] ?? null) ? $row['usage'] : [];

        return [
            'insights' => $this->stringList($row['insights'] ?? []),
            'recommendations' => $this->stringList($row['recommendations'] ?? []),
            'risks' => $this->stringList($row['risks'] ?? []),
            'generated_at' => (string) ($row['generated_at'] ?? now()->toIso8601String()),
            'usage' => [
                'input_tokens' => (int) ($usage['input_tokens'] ?? 0),
                'output_tokens' => (int) ($usage['output_tokens'] ?? 0),
            ],
        ];
    }

    /**
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
            if (is_string($entry) && $entry !== '') {
                $out[] = $entry;
            }
        }
        return $out;
    }
}
