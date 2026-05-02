<?php

declare(strict_types=1);

namespace App\Domain\AI\Actions;

use App\Domain\AI\DataTransferObjects\GeneratedMenuItem;
use App\Domain\AI\Enums\AiFeature;
use App\Domain\AI\Services\AnthropicClient;
use App\Domain\Tenant\Models\Tenant;

/**
 * Generates a Central-Asian-flavoured menu for a given cuisine type.
 *
 * The system prompt anchors Claude to:
 *   1. Authentic ingredient names (so "lavash" stays "lavash", not "lavash wrap"),
 *   2. Region-appropriate price ranges (UZS / KZT / RUB),
 *   3. Multi-locale fields (uz/ru/en at minimum, optional kz).
 *
 * The Action returns an array of {@see GeneratedMenuItem} DTOs that the
 * caller (admin controller or onboarding wizard) can either:
 *   - Render directly to the wizard UI for user review,
 *   - Pipe into a follow-up CreateMenuItemsBatchAction for persistence.
 *
 * Cost: Opus 4.7 typical menu (25 items, 4 locales) ~5k input + 6k output
 * tokens ≈ $0.08 per generation.
 */
final class GenerateMenuAction
{
    /** Default if caller doesn't pass a list. Always include uz/ru/en. */
    private const DEFAULT_LOCALES = ['uz', 'ru', 'en'];

    public function __construct(
        private readonly AnthropicClient $client,
    ) {
    }

    /**
     * @param  Tenant|null  $tenant       Source for country / currency context. Pass
     *                                    null only from the public onboarding flow
     *                                    where the tenant doesn't exist yet.
     * @param  string  $cuisineType       Free-text — Claude handles "pizza",
     *                                    "fastfood", "choyxona", "bakery", etc.
     * @param  int  $itemCount            How many items to generate (10-40).
     * @param  array<int, string>|null  $locales  ISO-639-1 codes; default uz/ru/en.
     * @param  string|null  $countryCode  Override tenant country (used by public route).
     * @param  string|null  $currencyCode Override tenant currency.
     * @return array<int, GeneratedMenuItem>
     */
    public function __invoke(
        ?Tenant $tenant,
        string $cuisineType,
        int $itemCount = 25,
        ?array $locales = null,
        ?string $countryCode = null,
        ?string $currencyCode = null,
    ): array {
        $itemCount = max(5, min(40, $itemCount));
        $locales = $this->normalizeLocales($locales);
        $country = $countryCode ?? (string) ($tenant->country_code ?? 'UZ');
        $currency = $currencyCode ?? (string) ($tenant->currency_code ?? $tenant->default_currency ?? 'UZS');

        $systemPrompt = <<<'PROMPT'
You are a Central Asian restaurant menu consultant for the MyPOS platform.
Generate authentic, locally-appealing menu items that reflect cuisine traditions,
ingredient availability, and pricing norms in Uzbekistan, Kazakhstan, Kyrgyzstan,
Tajikistan, and Russia.

Strict rules:
1. Output ONLY a JSON array. No prose, no markdown fences.
2. Every item MUST include all locales requested in the user message.
3. Names should be authentic — never anglicise local dishes.
4. Descriptions are 1-2 short sentences, appetising, no marketing fluff.
5. Categories are one of: "starter", "main", "dessert", "drink", "side".
6. Prices are integers in the tenant's currency MINOR units (UZS has 0 fraction digits, USD has 2).
7. Include exactly one food emoji per item (no flags, no faces).
PROMPT;

        $localesList = implode(',', $locales);
        $userPrompt = <<<EOT
Generate {$itemCount} menu items for a "{$cuisineType}" restaurant operating in {$country}.
Locales required (use these exact keys): {$localesList}
Currency: {$currency} (suggested_price_minor must be an integer in {$currency} minor units)

Output a JSON ARRAY of items. Each item:
{
  "name": { "{$locales[0]}": "...", ... },
  "description": { "{$locales[0]}": "...", ... },
  "category": "starter|main|dessert|drink|side",
  "suggested_price_minor": <integer>,
  "emoji": "<single food emoji>"
}

Sort by category. No duplicates. Do not include any text before or after the array.
EOT;

        $response = $this->client->message(
            usageType: AiFeature::MenuGenerator,
            systemPrompt: $systemPrompt,
            userMessage: $userPrompt,
        );

        $text = $this->client->extractText($response);
        $rawItems = $this->client->extractJsonArray($text);

        $dtos = [];
        foreach ($rawItems as $row) {
            if (! is_array($row)) {
                continue;
            }
            $dto = GeneratedMenuItem::fromArray($row);
            if ($dto !== null) {
                $dtos[] = $dto;
            }
        }

        return $dtos;
    }

    /**
     * @param  array<int, string>|null  $input
     * @return array<int, string>
     */
    private function normalizeLocales(?array $input): array
    {
        if (! is_array($input) || $input === []) {
            return self::DEFAULT_LOCALES;
        }

        $clean = [];
        foreach ($input as $locale) {
            if (is_string($locale) && $locale !== '') {
                $clean[] = strtolower($locale);
            }
        }
        // Always guarantee uz/ru/en presence — the wizard renders all three.
        foreach (self::DEFAULT_LOCALES as $required) {
            if (! in_array($required, $clean, true)) {
                $clean[] = $required;
            }
        }
        return array_values(array_unique($clean));
    }
}
