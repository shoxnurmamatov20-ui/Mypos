<?php

declare(strict_types=1);

namespace App\Domain\AI\Exceptions;

use RuntimeException;

/**
 * Raised by {@see \App\Domain\AI\Services\AiQuotaGuard} when the caller's
 * tier-based daily AI budget is exhausted.
 *
 * Maps to HTTP 429 in {@see \App\Http\Controllers\Api\V1\Admin\AIController}.
 */
class AiQuotaExceededException extends RuntimeException
{
    public function __construct(
        public readonly int $usedToday,
        public readonly ?int $dailyLimit,
        public readonly string $tier,
    ) {
        parent::__construct(
            "AI quota exhausted for tier '{$tier}' ({$usedToday}/" .
            ($dailyLimit ?? '∞') . ' requests today)'
        );
    }
}
