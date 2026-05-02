<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Services;

use App\Domain\Tenant\Exceptions\EasBuildException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Thin REST wrapper around the EAS Build API.
 *
 * Why a service (not a job): the wire format may evolve and we want a single
 * place to update auth headers / request shapes. The actual long-running
 * build dispatch is invoked from {@see \App\Jobs\DispatchEasBuildJob} so HTTP
 * latency does not block the user clicking "Generate App".
 *
 * Auth: bearer token from `config('eas.access_token')` — a personal-access
 * token issued at https://expo.dev/accounts/<org>/settings/access-tokens.
 *
 * Failure mode:
 *   - missing token / project id → throw {@see EasBuildException} early
 *     (don't silently no-op — the dashboard would show a build perpetually
 *     stuck in `queued`, which is worse than a clean error).
 *   - non-2xx from EAS → throw {@see EasBuildException} with body included.
 *
 * Rate limits: EAS publishes ~60 build dispatches / hour / account. We do
 * not enforce that here; rely on the queue (single-server scheduler) +
 * tenant-level UI throttle on "Generate App".
 */
class EasBuildClient
{
    public function __construct(
        private readonly ?string $accessToken = null,
        private readonly ?string $projectId = null,
        private readonly ?string $baseUrl = null,
        private readonly ?int $dispatchTimeout = null,
        private readonly ?int $pollTimeout = null,
    ) {
    }

    /**
     * Build the configured EAS Build entry payload (POST /v2/projects/{id}/builds).
     *
     * `$config` mirrors the JSON shape EAS expects — we don't munge it here so
     * the call site (DispatchEasBuildJob) stays the source of truth for what
     * the build looks like.
     *
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     *
     * @throws EasBuildException
     */
    public function dispatchBuild(array $config): array
    {
        $this->ensureConfigured();
        $url = sprintf('%s/v2/projects/%s/builds', $this->resolvedBaseUrl(), $this->resolvedProjectId());

        $response = $this->client(timeout: $this->resolvedDispatchTimeout())->post($url, $config);

        if (! $response->successful()) {
            throw new EasBuildException(sprintf(
                'EAS Build dispatch failed (%d): %s',
                $response->status(),
                $this->safeBody($response),
            ));
        }

        $payload = $response->json('data');
        if (! is_array($payload)) {
            throw new EasBuildException('EAS Build dispatch returned an unexpected payload: ' . $this->safeBody($response));
        }
        return $payload;
    }

    /**
     * Fetch the current state of an EAS build.
     *
     * @return array<string, mixed>
     *
     * @throws EasBuildException
     */
    public function getBuild(string $easBuildId): array
    {
        $this->ensureConfigured(needsProject: false);
        $url = sprintf('%s/v2/builds/%s', $this->resolvedBaseUrl(), $easBuildId);

        $response = $this->client(timeout: $this->resolvedPollTimeout())->get($url);

        if (! $response->successful()) {
            throw new EasBuildException(sprintf(
                'EAS Build status fetch failed (%d): %s',
                $response->status(),
                $this->safeBody($response),
            ));
        }

        $payload = $response->json('data');
        if (! is_array($payload)) {
            throw new EasBuildException('EAS Build status returned an unexpected payload: ' . $this->safeBody($response));
        }
        return $payload;
    }

    /**
     * Cancel an in-progress EAS build. EAS responds 204 on success and 4xx
     * if the build is already terminal — both are accepted here so the caller
     * can treat cancellation as best-effort.
     *
     * @throws EasBuildException
     */
    public function cancelBuild(string $easBuildId): void
    {
        $this->ensureConfigured(needsProject: false);
        $url = sprintf('%s/v2/builds/%s', $this->resolvedBaseUrl(), $easBuildId);

        $response = $this->client(timeout: $this->resolvedPollTimeout())->delete($url);

        if (! $response->successful() && $response->status() !== 404 && $response->status() !== 409) {
            throw new EasBuildException(sprintf(
                'EAS Build cancel failed (%d): %s',
                $response->status(),
                $this->safeBody($response),
            ));
        }
    }

    /**
     * Fail-fast guard. Throws if the env-driven config is missing — a clear
     * 503 / log entry is friendlier than a silent NULL bearer header.
     */
    private function ensureConfigured(bool $needsProject = true): void
    {
        if (($this->accessToken ?? config('eas.access_token')) === null
            || trim((string) ($this->accessToken ?? config('eas.access_token'))) === ''
        ) {
            throw new EasBuildException('EAS Build is not configured: EAS_ACCESS_TOKEN is missing.');
        }

        if ($needsProject) {
            if (($this->projectId ?? config('eas.project_id')) === null
                || trim((string) ($this->projectId ?? config('eas.project_id'))) === ''
            ) {
                throw new EasBuildException('EAS Build is not configured: EAS_PROJECT_ID is missing.');
            }
        }
    }

    private function client(int $timeout): PendingRequest
    {
        $token = (string) ($this->accessToken ?? config('eas.access_token'));
        return Http::withToken($token)
            ->acceptJson()
            ->asJson()
            ->timeout($timeout);
    }

    private function resolvedBaseUrl(): string
    {
        return rtrim((string) ($this->baseUrl ?? config('eas.base_url', 'https://api.expo.dev')), '/');
    }

    private function resolvedProjectId(): string
    {
        return (string) ($this->projectId ?? config('eas.project_id'));
    }

    private function resolvedDispatchTimeout(): int
    {
        return (int) ($this->dispatchTimeout ?? config('eas.dispatch_timeout', 60));
    }

    private function resolvedPollTimeout(): int
    {
        return (int) ($this->pollTimeout ?? config('eas.poll_timeout', 15));
    }

    /**
     * Avoid leaking large response bodies into logs while still giving an
     * operator enough context to file a Sentry issue.
     */
    private function safeBody(Response $response): string
    {
        $body = $response->body();
        if (strlen($body) <= 500) {
            return $body;
        }
        return substr($body, 0, 500) . '… (truncated)';
    }
}
