<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Exceptions;

use RuntimeException;

/**
 * Thrown by {@see \App\Domain\Tenant\Services\EasBuildClient} when a request
 * to the EAS Build REST API fails (non-2xx) or when the client is asked to
 * dispatch a build but `EAS_ACCESS_TOKEN` / `EAS_PROJECT_ID` are not set.
 *
 * Caught by {@see \App\Jobs\DispatchEasBuildJob} so the corresponding
 * `tenant_app_builds` row is flipped to `errored` with a meaningful
 * `error_message` instead of crashing the queue worker.
 */
class EasBuildException extends RuntimeException
{
}
