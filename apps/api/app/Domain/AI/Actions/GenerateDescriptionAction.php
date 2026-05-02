<?php

declare(strict_types=1);

namespace App\Domain\AI\Actions;

use App\Domain\AI\DataTransferObjects\TranslationBundle;
use App\Domain\AI\Enums\AiFeature;
use App\Domain\AI\Services\AnthropicClient;

/**
 * Produce an appetising 1-sentence menu-item description in all locales.
 *
 * Inputs:
 *   - `name` — dish name (used by Claude as cultural anchor; may be a single
 *              string OR a per-locale map. We pass through raw — Claude is
 *              fine with either shape).
 *   - `ingredients` — comma-separated ingredient list (free-text). Optional
 *                     but improves tone significantly.
 *   - `tone` — "appetizing" (default) | "premium" | "casual" — feeds into
 *              system prompt to bias style.
 *
 * Returns a {@see TranslationBundle} keyed by `_` (single-string mode), so
 * the controller can call `bundle->single()` to get the locale → text map.
 *
 * Cost: ~$0.005 per description (small input + ~120 output tokens).
 */
final class GenerateDescriptionAction
{
    /** Stable key used in the bundle (matches AutoTranslateAction convention). */
    private const SINGLE_KEY = '_';

    private const DEFAULT_LOCALES = ['uz', 'ru', 'en'];

    public function __construct(
        private readonly AnthropicClient $client,
    ) {
    }

    /**
     * @param  string|array<string, string>  $name  Dish name (string or per-locale map).
     * @param  string|null  $ingredients  Free-text ingredient list. Comma-separated works.
     * @param  array<int, string>|null  $locales  Defaults to uz/ru/en.
     * @param  string  $tone  appetizing|premium|casual.
     */
    public function __invoke(
        string|array $name,
        ?string $ingredients = null,
        ?array $locales = null,
        string $tone = 'appetizing',
    ): TranslationBundle {
        $locales = $this->normalizeLocales($locales);
        $tone = in_array($tone, ['appetizing', 'premium', 'casual'], true) ? $tone : 'appetizing';

        $nameLine = is_array($name) ? json_encode($name, JSON_UNESCAPED_UNICODE) : (string) $name;
        $ingredientsLine = ($ingredients === null || trim($ingredients) === '')
            ? 'Not provided — infer from the name.'
            : $ingredients;
        $localesList = implode(',', $locales);

        $systemPrompt = <<<'PROMPT'
You are a menu copywriter for Central Asian restaurants. Write short,
appetising 1-sentence descriptions that respect local food culture.

Strict rules:
1. Output ONLY a JSON object — no prose, no markdown fences.
2. Each description is 1 sentence, max 18 words.
3. Avoid generic adjectives ("delicious", "amazing"). Use sensory and
   ingredient-led language ("smoky", "slow-braised", "tangy").
4. Keep traditional dish names in their original spelling (no translation).
5. Match the requested tone: appetizing | premium | casual.
PROMPT;

        $userPrompt = <<<EOT
Dish name: {$nameLine}
Ingredients: {$ingredientsLine}
Tone: {$tone}
Target locales: {$localesList}

Output a JSON object of this shape:
{
  "_": { "{$locales[0]}": "<one-sentence description>", ... }
}
Use the exact key "_" at the top level so the caller can reuse the translator
contract. Include only the requested locales. No commentary.
EOT;

        $response = $this->client->message(
            usageType: AiFeature::Description,
            systemPrompt: $systemPrompt,
            userMessage: $userPrompt,
        );

        $text = $this->client->extractText($response);
        $raw = $this->client->extractJsonObject($text);

        // Defensive: if Claude returned a flat locale map without the `_`
        // wrapper, wrap it back so the bundle accessor works uniformly.
        if (! isset($raw[self::SINGLE_KEY]) && $this->looksLikeLocaleMap($raw)) {
            $raw = [self::SINGLE_KEY => $raw];
        }

        return TranslationBundle::fromArray($raw);
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
        return $clean === [] ? self::DEFAULT_LOCALES : array_values(array_unique($clean));
    }

    /**
     * @param  array<string, mixed>  $raw
     */
    private function looksLikeLocaleMap(array $raw): bool
    {
        if ($raw === []) {
            return false;
        }
        foreach (array_keys($raw) as $key) {
            if (! is_string($key) || strlen($key) > 4) {
                return false;
            }
        }
        return true;
    }
}
