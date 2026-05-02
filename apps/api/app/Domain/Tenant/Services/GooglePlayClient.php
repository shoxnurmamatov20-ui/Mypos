<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Services;

use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Google Play Developer API client.
 *
 * Auth: OAuth 2.0 service-account JSON. The official google/apiclient package
 * handles token minting + refresh transparently.
 *
 * Status: FRAMEWORK ONLY. The real Play submission flow is:
 *
 *   1. edits.insert(packageName)                 → returns editId
 *   2. edits.bundles.upload(editId, aabBytes)    → returns versionCode
 *   3. edits.tracks.update(editId, track, [versionCode])
 *   4. edits.commit(editId)                      → release goes live or
 *                                                  enters review depending
 *                                                  on track + rollout %.
 *
 * Implemented stubs so SubmitToStoreJob compiles. Replace with real
 * google/apiclient calls once that dependency is added — see TODOs.
 *
 * NB: google/apiclient is NOT currently in composer.json (see bottom of the
 * agent output for the dependency note). When it lands, switch from the
 * `class_exists()` guard to a hard import + DI-injected `Google\Client`.
 */
class GooglePlayClient
{
    /**
     * Decoded service-account credentials (minted from the env var). Kept
     * private so callers can't accidentally serialize the secret into logs.
     *
     * @var array<string, mixed>
     */
    private array $credentials;

    public function __construct(string $serviceAccountJson)
    {
        if ($serviceAccountJson === '') {
            // Construct with empty credentials so DI can wire the singleton
            // even before the env is configured. Methods will fail loudly
            // if invoked while uninitialized.
            $this->credentials = [];
            return;
        }

        $decoded = json_decode($serviceAccountJson, true);
        if (! is_array($decoded)) {
            throw new RuntimeException('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON did not decode to an object.');
        }
        $this->credentials = $decoded;
    }

    /**
     * Upload an AAB to Play Console and roll it onto the configured track.
     *
     * @param string $packageName  e.g. uz.mypos.jomeburger
     * @param string $aabPath      local path or HTTPS URL to the .aab artifact
     * @param string $track        production | beta | alpha | internal
     *
     * @return string  The Play `versionCode` (numeric build counter).
     *
     * TODO(D3-prod): wire google/apiclient. Sketch:
     *
     *   $client = new \Google\Client();
     *   $client->setAuthConfig($this->credentials);
     *   $client->addScope(\Google\Service\AndroidPublisher::ANDROIDPUBLISHER);
     *
     *   $publisher = new \Google\Service\AndroidPublisher($client);
     *   $edit = $publisher->edits->insert($packageName, new \Google\Service\AndroidPublisher\AppEdit());
     *   $bundle = $publisher->edits_bundles->upload(
     *       $packageName, $edit->getId(), [],
     *       ['data' => file_get_contents($aabPath), 'uploadType' => 'media', 'mimeType' => 'application/octet-stream']
     *   );
     *   $publisher->edits_tracks->update(
     *       $packageName, $edit->getId(), $track,
     *       new \Google\Service\AndroidPublisher\Track([
     *           'releases' => [[
     *               'name' => "{$bundle->versionCode}",
     *               'versionCodes' => [(string) $bundle->versionCode],
     *               'status' => 'completed',
     *           ]],
     *       ])
     *   );
     *   $publisher->edits->commit($packageName, $edit->getId());
     *   return (string) $bundle->versionCode;
     */
    public function uploadAab(string $packageName, string $aabPath, string $track = 'internal'): string
    {
        $this->assertConfigured();
        $this->refuseInProduction('uploadAab');

        Log::info('GooglePlayClient::uploadAab stubbed (non-prod)', [
            'package' => $packageName,
            'aab' => $aabPath,
            'track' => $track,
        ]);

        return 'stub-' . substr(hash('sha256', $packageName . $aabPath), 0, 12);
    }

    /**
     * Refuse to silently report success when in production with a stub
     * implementation. Without this, SubmitToStoreJob persists `submitted`
     * status but Google Play never received the AAB.
     */
    private function refuseInProduction(string $method): void
    {
        if (! app()->environment('production')) {
            return;
        }
        if ((bool) config('services.google_play.allow_stub_in_prod', false)) {
            return;
        }
        throw new \RuntimeException(sprintf(
            'GooglePlayClient::%s is unimplemented; refusing to fake success in production. Install google/apiclient, implement the real Play Console API call, OR set services.google_play.allow_stub_in_prod=true.',
            $method,
        ));
    }

    /**
     * Inspect the most recent release on the production track to determine
     * whether the previously uploaded build has been approved.
     *
     * Play Console doesn't expose a per-app "review_status" the way Apple
     * does — instead, a release in `inProgress` status is still rolling out;
     * `completed` means it's live to all opted users; `halted`/`draft` mean
     * we paused. Map these onto our SubmissionStatus enum at the call site.
     *
     * @return array{state: string, raw: array<string, mixed>}
     *
     * TODO(D3-prod): real GET via $publisher->edits_tracks->get + inspect
     * `releases[0].status`. For first launch we want to also poll
     * `purchases.subscriptionsv2` IF in-app purchases are configured; for
     * the MyPOS template that's out of scope.
     */
    public function getReviewStatus(string $packageName): array
    {
        $this->assertConfigured();

        Log::info('GooglePlayClient::getReviewStatus stubbed', [
            'package' => $packageName,
        ]);

        return [
            'state' => 'inProgress',
            'raw' => ['stub' => true],
        ];
    }

    /**
     * Generate the QR-code URL pointers Internal Testing testers can scan to
     * install the app. Play returns a stable opt-in link of the form
     * https://play.google.com/apps/internaltest?id=<packageName>; we hand it
     * back from here so callers can persist on TenantAppBuild.qr_code_url.
     */
    public function internalTestingOptInUrl(string $packageName): string
    {
        return sprintf('https://play.google.com/apps/internaltest?id=%s', urlencode($packageName));
    }

    private function assertConfigured(): void
    {
        if ($this->credentials === []) {
            throw new RuntimeException(
                'GooglePlayClient: service-account credentials are not configured. ' .
                'Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (base64-encoded JSON) in the environment.'
            );
        }
    }
}
