<?php

declare(strict_types=1);

namespace App\Domain\AI\DataTransferObjects;

use Spatie\LaravelData\Data;

/**
 * Result of {@see \App\Domain\AI\Actions\AutoTranslateAction}.
 *
 * Shape: `{ key1: { uz: ..., ru: ..., en: ... }, key2: { ... } }` where each
 * inner array maps target locale → translated string. Single-string callers
 * can use {@see TranslationBundle::single()} which collapses the synthetic
 * `_` key the action uses internally.
 */
class TranslationBundle extends Data
{
    /**
     * @param  array<string, array<string, string>>  $translations
     */
    public function __construct(
        public readonly array $translations,
    ) {
    }

    /**
     * Returns the locale map for a single-string translation request. The
     * action stores it under the `_` sentinel key.
     *
     * @return array<string, string>
     */
    public function single(): array
    {
        $entry = $this->translations['_'] ?? null;
        return is_array($entry) ? $entry : [];
    }

    /**
     * @param  array<string, mixed>  $raw
     */
    public static function fromArray(array $raw): self
    {
        /** @var array<string, array<string, string>> $clean */
        $clean = [];
        foreach ($raw as $key => $value) {
            if (! is_string($key) || ! is_array($value)) {
                continue;
            }
            $localeMap = [];
            foreach ($value as $locale => $translated) {
                if (is_string($locale) && is_string($translated)) {
                    $localeMap[strtolower($locale)] = $translated;
                }
            }
            if ($localeMap !== []) {
                $clean[$key] = $localeMap;
            }
        }

        return new self(translations: $clean);
    }
}
