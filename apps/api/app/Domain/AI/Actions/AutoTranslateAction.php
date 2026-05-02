<?php

declare(strict_types=1);

namespace App\Domain\AI\Actions;

use App\Domain\AI\DataTransferObjects\TranslationBundle;
use App\Domain\AI\Enums\AiFeature;
use App\Domain\AI\Services\AnthropicClient;

/**
 * Translate one or more strings into the target locales using Claude.
 *
 * Single-string mode collapses to the synthetic `_` key so the call cost is
 * bounded — the caller passes one string, the action makes one Messages API
 * call, and the {@see TranslationBundle::single()} helper unwraps it.
 *
 * Batch mode (array of strings keyed by stable string ids) packs all entries
 * into a single Claude call to amortise the system-prompt overhead — much
 * cheaper than N independent requests.
 *
 * Cost (typical ~30-char product name, 3 locales):
 *   single  ≈ $0.005
 *   batch of 10 keys ≈ $0.012 (savings vs 10x single)
 */
final class AutoTranslateAction
{
    /** Single key used internally when caller passes a bare string. */
    private const SINGLE_KEY = '_';

    public function __construct(
        private readonly AnthropicClient $client,
    ) {
    }

    /**
     * @param  string|array<string, string>  $source  Either one string, or a map
     *                                                of stable id → text. Stable
     *                                                ids let the caller round-trip
     *                                                without remembering order.
     * @param  string  $sourceLocale  ISO-639-1 of the input (e.g. 'uz').
     * @param  array<int, string>  $targetLocales  Locales to translate INTO.
     *                                              Source locale is auto-removed.
     */
    public function __invoke(
        string|array $source,
        string $sourceLocale,
        array $targetLocales,
    ): TranslationBundle {
        $sourceLocale = strtolower(trim($sourceLocale));
        $targets = $this->normalizeTargets($targetLocales, $sourceLocale);

        if ($targets === []) {
            // Nothing to translate to — return empty bundle.
            return new TranslationBundle(translations: []);
        }

        $items = is_string($source) ? [self::SINGLE_KEY => $source] : $source;
        $items = $this->cleanItems($items);
        if ($items === []) {
            return new TranslationBundle(translations: []);
        }

        $systemPrompt = <<<'PROMPT'
You are a professional translator for Central Asian (Markaziy Osiyo) languages:
Uzbek (uz), Russian (ru), English (en), Kazakh (kz), Kyrgyz (ky), Tajik (tg).

Strict rules:
1. Output ONLY a JSON object. No prose, no markdown fences.
2. Preserve meaning, tone, and cultural appropriateness.
3. Keep proper nouns, brand names, and food-specific Central Asian terms in their original form.
4. Match the input register (formal / informal / marketing).
5. Do not add explanatory parentheses.
PROMPT;

        $jsonItems = json_encode($items, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $targetList = implode(',', $targets);
        $userPrompt = <<<EOT
Translate these strings from "{$sourceLocale}" to: {$targetList}.

Input (keys are opaque IDs — preserve them):
{$jsonItems}

Output a JSON OBJECT with the same keys, each mapping to a locale → translation map:
{
  "<id>": { "<locale>": "<translated>", ... },
  ...
}
Include only the requested target locales. No commentary.
EOT;

        $response = $this->client->message(
            usageType: AiFeature::Translator,
            systemPrompt: $systemPrompt,
            userMessage: $userPrompt,
        );

        $text = $this->client->extractText($response);
        $raw = $this->client->extractJsonObject($text);

        return TranslationBundle::fromArray($raw);
    }

    /**
     * Remove the source locale from the target list and normalise casing.
     * Empty result is a no-op signal upstream.
     *
     * @param  array<int, string>  $targets
     * @return array<int, string>
     */
    private function normalizeTargets(array $targets, string $sourceLocale): array
    {
        $clean = [];
        foreach ($targets as $locale) {
            if (! is_string($locale) || $locale === '') {
                continue;
            }
            $lc = strtolower(trim($locale));
            if ($lc !== $sourceLocale) {
                $clean[] = $lc;
            }
        }
        return array_values(array_unique($clean));
    }

    /**
     * Drop empty / non-string entries from the input map.
     *
     * @param  array<string, mixed>  $items
     * @return array<string, string>
     */
    private function cleanItems(array $items): array
    {
        $clean = [];
        foreach ($items as $key => $value) {
            if (! is_string($key) || $key === '') {
                continue;
            }
            if (! is_string($value) || trim($value) === '') {
                continue;
            }
            $clean[$key] = $value;
        }
        return $clean;
    }
}
