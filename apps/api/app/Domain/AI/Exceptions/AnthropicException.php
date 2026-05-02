<?php

declare(strict_types=1);

namespace App\Domain\AI\Exceptions;

use RuntimeException;

/**
 * Raised by {@see \App\Domain\AI\Services\AnthropicClient} when the upstream
 * Messages API returns a non-2xx response or is otherwise unreachable.
 *
 * Caught by Action classes / controllers to surface a 502 envelope. The
 * audit-log row is written *before* the exception bubbles, so the failure
 * is observable in the cost dashboard.
 */
class AnthropicException extends RuntimeException
{
}
