<?php

declare(strict_types=1);

namespace App\Domain\AI\DataTransferObjects;

use Spatie\LaravelData\Data;

/**
 * One menu item produced by {@see \App\Domain\AI\Actions\GenerateMenuAction}.
 *
 * Field choices mirror the JSON schema in the system prompt so we can round-
 * trip cleanly. `name` and `description` are stored as flat string maps keyed
 * by ISO-639-1 locale ('uz', 'ru', 'en', 'kz'); missing locales fall back to
 * the empty string at the consumer side.
 *
 * `suggested_price_minor` is in *minor units* of the tenant's currency (so for
 * UZS it's the same value as major because UZS has 0 fraction digits; for USD
 * 1499 means $14.99). The wizard renders this raw and the import job converts
 * it as needed.
 */
class GeneratedMenuItem extends Data
{
    /**
     * @param  array<string, string>  $name
     * @param  array<string, string>  $description
     */
    public function __construct(
        public readonly array $name,
        public readonly array $description,
        public readonly string $category,
        public readonly int $suggested_price_minor,
        public readonly ?string $emoji = null,
    ) {
    }

    /**
     * Defensive constructor used by the action layer to coerce raw decoded JSON
     * (which may be missing keys, have stringified ints, etc.) into a typed
     * DTO. Anything malformed is dropped silently — the caller filters nulls.
     *
     * @param  array<string, mixed>  $row
     */
    public static function fromArray(array $row): ?self
    {
        $name = $row['name'] ?? null;
        $description = $row['description'] ?? null;
        $category = $row['category'] ?? null;
        $price = $row['suggested_price_minor'] ?? $row['price'] ?? null;

        if (! is_array($name) || $name === []) {
            return null;
        }
        if (! is_array($description)) {
            $description = [];
        }
        if (! is_string($category) || $category === '') {
            $category = 'main';
        }
        if (! is_numeric($price)) {
            return null;
        }

        $nameMap = self::normalizeLocaleMap($name);
        $descMap = self::normalizeLocaleMap($description);
        if ($nameMap === []) {
            return null;
        }

        return new self(
            name: $nameMap,
            description: $descMap,
            category: strtolower((string) $category),
            suggested_price_minor: (int) $price,
            emoji: isset($row['emoji']) && is_string($row['emoji']) ? $row['emoji'] : null,
        );
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, string>
     */
    private static function normalizeLocaleMap(array $raw): array
    {
        $out = [];
        foreach ($raw as $locale => $value) {
            if (is_string($locale) && is_string($value)) {
                $out[strtolower($locale)] = $value;
            }
        }
        return $out;
    }
}
