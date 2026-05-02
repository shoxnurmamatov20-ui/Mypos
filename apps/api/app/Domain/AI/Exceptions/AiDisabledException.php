<?php

declare(strict_types=1);

namespace App\Domain\AI\Exceptions;

use RuntimeException;

/**
 * Raised when AI features are disabled by the master kill-switch
 * (`config('anthropic.enabled')` = false) or the API key is empty.
 *
 * Maps to HTTP 503.
 */
class AiDisabledException extends RuntimeException
{
}
