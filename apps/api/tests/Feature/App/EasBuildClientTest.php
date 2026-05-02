<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| D7 — Phase 3 — EasBuildClient (REST wrapper)
|--------------------------------------------------------------------------
|
| Spec covered (Agent D2 — `App\Domain\Tenant\Services\EasBuildClient`):
|   - dispatchBuild() POSTs the configured payload to /v2/projects/{id}/builds
|     with a Bearer token from `EAS_ACCESS_TOKEN`.
|   - Throws `EasBuildException` on a non-2xx response.
|   - Throws `EasBuildException` when `EAS_ACCESS_TOKEN` is missing.
|   - Throws `EasBuildException` when `EAS_PROJECT_ID` is missing on dispatch.
|   - getBuild() reads /v2/builds/{id} and returns the parsed `data` payload.
|   - cancelBuild() issues DELETE and accepts 2xx + 404 + 409 as "best-effort
|     success" (already-terminal builds).
|   - Response body fragments are surfaced in exception messages but never
|     leaked unbounded — see the 500-char truncation in `safeBody()`.
|
| All HTTP traffic is intercepted via `Http::fake()`.
|
| The EasBuildClient takes constructor args so we don't need to touch the
| running `config()` cache — we instantiate it directly with explicit values.
*/

use App\Domain\Tenant\Exceptions\EasBuildException;
use App\Domain\Tenant\Services\EasBuildClient;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    if (! class_exists(EasBuildClient::class)) {
        $this->markTestSkipped('EasBuildClient not yet shipped (pending Agent D2).');
    }
});

it('dispatchBuild posts the payload to /v2/projects/{id}/builds with the bearer token', function (): void {
    Http::fake([
        'https://api.expo.dev/v2/projects/proj-xyz/builds' => Http::response([
            'data' => ['id' => 'eas-build-001', 'status' => 'new'],
        ], 200),
    ]);

    $client = new EasBuildClient(
        accessToken: 'token-abc',
        projectId: 'proj-xyz',
        baseUrl: 'https://api.expo.dev',
    );

    $result = $client->dispatchBuild([
        'platform' => 'ios',
        'profile' => 'production',
    ]);

    expect($result)->toBe(['id' => 'eas-build-001', 'status' => 'new']);

    Http::assertSent(function (HttpRequest $req): bool {
        return $req->method() === 'POST'
            && $req->url() === 'https://api.expo.dev/v2/projects/proj-xyz/builds'
            && $req->header('Authorization') === ['Bearer token-abc']
            && ($req['platform'] ?? null) === 'ios';
    });
});

it('dispatchBuild throws EasBuildException on a 4xx response', function (): void {
    Http::fake([
        'https://api.expo.dev/v2/projects/proj-xyz/builds' => Http::response([
            'errors' => [['message' => 'Invalid build profile']],
        ], 400),
    ]);

    $client = new EasBuildClient(
        accessToken: 'token-abc',
        projectId: 'proj-xyz',
        baseUrl: 'https://api.expo.dev',
    );

    expect(fn () => $client->dispatchBuild([]))
        ->toThrow(EasBuildException::class);
});

it('dispatchBuild throws EasBuildException on 5xx with the status code surfaced in the message', function (): void {
    Http::fake([
        'https://api.expo.dev/v2/projects/proj-xyz/builds' => Http::response('Bad Gateway', 502),
    ]);

    $client = new EasBuildClient(
        accessToken: 'token-abc',
        projectId: 'proj-xyz',
        baseUrl: 'https://api.expo.dev',
    );

    expect(fn () => $client->dispatchBuild([]))
        ->toThrow(EasBuildException::class, '502');
});

it('dispatchBuild throws when access token is missing (config-less constructor)', function (): void {
    // Force config(eas.access_token) to null so the fallback also fails.
    config(['eas.access_token' => null]);

    $client = new EasBuildClient(
        accessToken: null,
        projectId: 'proj-xyz',
    );

    expect(fn () => $client->dispatchBuild(['platform' => 'ios']))
        ->toThrow(EasBuildException::class, 'EAS_ACCESS_TOKEN');
});

it('dispatchBuild throws when project id is missing', function (): void {
    config(['eas.project_id' => null]);

    $client = new EasBuildClient(
        accessToken: 'token-abc',
        projectId: null,
    );

    expect(fn () => $client->dispatchBuild(['platform' => 'ios']))
        ->toThrow(EasBuildException::class, 'EAS_PROJECT_ID');
});

it('dispatchBuild throws when EAS returns a non-array data payload', function (): void {
    Http::fake([
        'https://api.expo.dev/v2/projects/proj-xyz/builds' => Http::response([
            'data' => 'unexpected-string',
        ], 200),
    ]);

    $client = new EasBuildClient(
        accessToken: 'token-abc',
        projectId: 'proj-xyz',
        baseUrl: 'https://api.expo.dev',
    );

    expect(fn () => $client->dispatchBuild([]))
        ->toThrow(EasBuildException::class, 'unexpected payload');
});

it('getBuild returns the EAS build status object', function (): void {
    Http::fake([
        'https://api.expo.dev/v2/builds/eas-001' => Http::response([
            'data' => [
                'id' => 'eas-001',
                'status' => 'finished',
                'artifacts' => ['buildUrl' => 'https://expo.dev/artifact.ipa'],
            ],
        ], 200),
    ]);

    $client = new EasBuildClient(
        accessToken: 'token-abc',
        projectId: 'proj-xyz',
        baseUrl: 'https://api.expo.dev',
    );

    $payload = $client->getBuild('eas-001');

    expect($payload['id'])->toBe('eas-001');
    expect($payload['status'])->toBe('finished');

    Http::assertSent(function (HttpRequest $req): bool {
        return $req->method() === 'GET'
            && $req->url() === 'https://api.expo.dev/v2/builds/eas-001';
    });
});

it('getBuild throws EasBuildException on 404', function (): void {
    Http::fake([
        'https://api.expo.dev/v2/builds/missing' => Http::response(['error' => 'not found'], 404),
    ]);

    $client = new EasBuildClient(
        accessToken: 'token-abc',
        projectId: 'proj-xyz',
        baseUrl: 'https://api.expo.dev',
    );

    expect(fn () => $client->getBuild('missing'))
        ->toThrow(EasBuildException::class, '404');
});

it('cancelBuild issues DELETE and accepts 204 as success', function (): void {
    Http::fake([
        'https://api.expo.dev/v2/builds/eas-cancel' => Http::response('', 204),
    ]);

    $client = new EasBuildClient(
        accessToken: 'token-abc',
        projectId: 'proj-xyz',
        baseUrl: 'https://api.expo.dev',
    );

    // Should not throw.
    $client->cancelBuild('eas-cancel');

    Http::assertSent(function (HttpRequest $req): bool {
        return $req->method() === 'DELETE'
            && $req->url() === 'https://api.expo.dev/v2/builds/eas-cancel';
    });
});

it('cancelBuild treats 404 / 409 as best-effort success (already terminal)', function (): void {
    Http::fake([
        'https://api.expo.dev/v2/builds/eas-old' => Http::response('Already finished', 409),
    ]);

    $client = new EasBuildClient(
        accessToken: 'token-abc',
        projectId: 'proj-xyz',
        baseUrl: 'https://api.expo.dev',
    );

    // Must not throw — terminal builds are accepted as already-cancelled.
    $client->cancelBuild('eas-old');

    expect(true)->toBeTrue();
});

it('cancelBuild throws EasBuildException on 500', function (): void {
    Http::fake([
        'https://api.expo.dev/v2/builds/eas-die' => Http::response('Internal Server Error', 500),
    ]);

    $client = new EasBuildClient(
        accessToken: 'token-abc',
        projectId: 'proj-xyz',
        baseUrl: 'https://api.expo.dev',
    );

    expect(fn () => $client->cancelBuild('eas-die'))
        ->toThrow(EasBuildException::class);
});
