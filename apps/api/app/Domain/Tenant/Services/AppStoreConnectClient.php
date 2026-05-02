<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Apple App Store Connect API client.
 *
 * Auth: ES256-signed JWT, regenerated per request (cheap; ~1ms each).
 *
 *   Header: { "alg": "ES256", "kid": $keyId, "typ": "JWT" }
 *   Claims: { "iss": $issuerId, "exp": now+20m, "aud": "appstoreconnect-v1" }
 *
 * Apple rejects JWTs older than 20 minutes (App Store Connect API docs:
 * https://developer.apple.com/documentation/appstoreconnectapi/generating_tokens_for_api_requests).
 *
 * Two ownership models:
 *   - build_account=mypos    → singleton instance bound from config('services.apple_app_store')
 *                              by AppServiceProvider (D3 owns this).
 *   - build_account=tenant   → instantiated per-call inside SubmitToStoreJob
 *                              from per-tenant credentials stored encrypted on
 *                              the TenantApp row. Out of scope for this file.
 *
 * Status: FRAMEWORK ONLY. Apple's submission flow is multi-step (create
 * appStoreVersion → upload build via TestFlight → attach build → submit for
 * review) and the final implementation needs a real sandbox to validate.
 * The methods below stub the calls and document the TODOs.
 */
class AppStoreConnectClient
{
    /** Apple's strict 20-min cap on JWTs. We use 19m to leave headroom. */
    private const JWT_LIFETIME_SECONDS = 19 * 60;

    private const AUDIENCE = 'appstoreconnect-v1';

    public function __construct(
        private readonly string $issuerId,
        private readonly string $keyId,
        /**
         * .p8 file contents (PEM-formatted EC private key). The constructor
         * accepts the raw PEM string so callers can choose whether to base64-
         * decode (env-stored) or read from disk (test fixture) themselves.
         */
        private readonly string $privateKey,
        private readonly string $baseUrl = 'https://api.appstoreconnect.apple.com',
    ) {
    }

    // ------------------------------------------------------------------
    // JWT generation
    // ------------------------------------------------------------------

    /**
     * Generate a freshly signed JWT for one App Store Connect request.
     *
     * Implementation note: we sign manually rather than pulling in
     * firebase/php-jwt to avoid a new composer dependency for a single
     * algorithm we already need to support. Apple requires ES256 (ECDSA on
     * the P-256 curve) — PHP's openssl_sign returns the signature in DER
     * format which we must then convert to the JWS-required raw r||s pair.
     *
     * @throws RuntimeException when the private key is malformed or signing fails.
     */
    public function generateJwt(): string
    {
        $header = [
            'alg' => 'ES256',
            'kid' => $this->keyId,
            'typ' => 'JWT',
        ];

        $now = time();
        $claims = [
            'iss' => $this->issuerId,
            'exp' => $now + self::JWT_LIFETIME_SECONDS,
            'aud' => self::AUDIENCE,
        ];

        $segments = [
            $this->base64UrlEncode((string) json_encode($header, JSON_UNESCAPED_SLASHES)),
            $this->base64UrlEncode((string) json_encode($claims, JSON_UNESCAPED_SLASHES)),
        ];
        $signingInput = implode('.', $segments);

        $key = openssl_pkey_get_private($this->privateKey);
        if ($key === false) {
            throw new RuntimeException('Apple App Store Connect private key is malformed (.p8 contents not parseable).');
        }

        $derSignature = '';
        if (! openssl_sign($signingInput, $derSignature, $key, OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('Failed to sign App Store Connect JWT.');
        }

        // Convert DER ECDSA signature → JWS raw (r || s, 64 bytes for P-256).
        $rawSignature = $this->derToRaw($derSignature);
        $segments[] = $this->base64UrlEncode($rawSignature);

        return implode('.', $segments);
    }

    // ------------------------------------------------------------------
    // Public API surface — STUBBED.
    //
    // Each method documents the Apple endpoint(s) it must orchestrate and
    // returns a placeholder shape so SubmitToStoreJob compiles. Replace
    // with real HTTP calls + response parsing once a sandbox is wired.
    // ------------------------------------------------------------------

    /**
     * Submit the most recently uploaded build to Apple Review.
     *
     * Orchestration (TODO):
     *   1. POST /v1/appStoreVersions       — create a new draft version
     *   2. POST /v1/builds/.../relationships/appStoreVersion — attach the
     *      already-uploaded build (artifact_url is informational; Apple
     *      pulls the .ipa from TestFlight, which EAS uploads in its
     *      `eas submit` step).
     *   3. POST /v1/appStoreVersionSubmissions — push to "Waiting for Review"
     *
     * @return array{status: string, submission_id: string|null, raw: array<string, mixed>}
     */
    public function submitForReview(int $appId, string $artifactUrl): array
    {
        // FAIL-SAFE: in production, refuse to silently report `submitted`
        // when the implementation is still a stub. Otherwise the dashboard
        // marks builds as submitted but Apple has no record of them.
        $this->refuseInProduction('submitForReview');

        Log::info('AppStoreConnectClient::submitForReview stubbed (non-prod)', [
            'app_id' => $appId,
            'artifact_url' => $artifactUrl,
        ]);

        return [
            'status' => 'submitted',
            'submission_id' => null,
            'raw' => [
                'stub' => true,
                'note' => 'AppStoreConnectClient is in framework mode; see TODOs.',
            ],
        ];
    }

    /**
     * Poll the current review state of the latest version.
     *
     * Orchestration (TODO):
     *   1. GET /v1/apps/{appId}/appStoreVersions?limit=1&sort=-createdDate
     *   2. Inspect attributes.appStoreState — Apple uses values like:
     *      PREPARE_FOR_SUBMISSION, WAITING_FOR_REVIEW, IN_REVIEW,
     *      PENDING_DEVELOPER_RELEASE, READY_FOR_SALE, REJECTED, ...
     *   3. Map to our SubmissionStatus enum (handled by caller).
     *
     * @return array{state: string, raw: array<string, mixed>}
     */
    public function getReviewStatus(int $appId): array
    {
        $this->refuseInProduction('getReviewStatus');

        Log::info('AppStoreConnectClient::getReviewStatus stubbed (non-prod)', [
            'app_id' => $appId,
        ]);

        // Conservative — "still in review" so the poller doesn't transition.
        return [
            'state' => 'WAITING_FOR_REVIEW',
            'raw' => ['stub' => true],
        ];
    }

    /**
     * Refuses the call when running in production unless an explicit
     * `services.apple_app_store.allow_stub_in_prod` flag is set. Without
     * this, the service silently reports submission success and the
     * dashboard misleads tenants.
     */
    private function refuseInProduction(string $method): void
    {
        if (! app()->environment('production')) {
            return;
        }
        if ((bool) config('services.apple_app_store.allow_stub_in_prod', false)) {
            return;
        }
        throw new \RuntimeException(sprintf(
            'AppStoreConnectClient::%s is unimplemented; refusing to fake success in production. Implement the real Apple ASC API call OR set services.apple_app_store.allow_stub_in_prod=true to acknowledge stub mode.',
            $method,
        ));
    }

    /**
     * Create a new App Store record (first-time publish).
     *
     * TODO(D3-prod): POST /v1/apps with { bundleId, sku, primaryLocale, ... }.
     * Used by GenerateNativeAppAction (Agent D2) on first build of a new
     * tenant_app — not invoked from the post-build pipeline.
     */
    public function createApp(array $appPayload): array
    {
        $this->refuseInProduction('createApp');
        Log::info('AppStoreConnectClient::createApp stubbed (non-prod)', $appPayload);

        return ['stub' => true, 'app_id' => null];
    }

    // ------------------------------------------------------------------
    // Internal helpers
    // ------------------------------------------------------------------

    /**
     * Configured Http client for downstream method implementations.
     * Centralizes Bearer token + base URL so each method body stays tidy.
     */
    private function client(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->withToken($this->generateJwt())
            ->acceptJson()
            ->asJson()
            ->timeout(30);
    }

    /**
     * URL-safe base64 (no padding) — JWS standard.
     */
    private function base64UrlEncode(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }

    /**
     * Convert OpenSSL DER ECDSA signature into raw r||s expected by JWS/ES256.
     *
     * DER layout for ECDSA: 0x30 LEN 0x02 R_LEN R 0x02 S_LEN S
     * For P-256 we want 32 bytes of R followed by 32 bytes of S.
     *
     * (Compact, hand-written — same logic firebase/php-jwt uses internally.)
     */
    private function derToRaw(string $der): string
    {
        $offset = 0;

        // SEQUENCE
        if (($der[$offset++] ?? '') !== "\x30") {
            throw new RuntimeException('Invalid DER ECDSA signature: missing SEQUENCE.');
        }
        // SEQUENCE length — accept short form only (sufficient for ES256 ~70 bytes).
        $offset++;

        // INTEGER R
        if (($der[$offset++] ?? '') !== "\x02") {
            throw new RuntimeException('Invalid DER ECDSA signature: missing INTEGER R.');
        }
        $rLen = ord($der[$offset++]);
        $r = substr($der, $offset, $rLen);
        $offset += $rLen;

        // INTEGER S
        if (($der[$offset++] ?? '') !== "\x02") {
            throw new RuntimeException('Invalid DER ECDSA signature: missing INTEGER S.');
        }
        $sLen = ord($der[$offset++]);
        $s = substr($der, $offset, $sLen);

        // Strip ASN.1 leading zero byte (added when high bit set), then
        // left-pad each component to 32 bytes (P-256 component size).
        $r = $this->padComponent($r, 32);
        $s = $this->padComponent($s, 32);

        return $r . $s;
    }

    private function padComponent(string $bytes, int $targetLen): string
    {
        // Strip leading 0x00 sign byte if present.
        if (strlen($bytes) > $targetLen && $bytes[0] === "\x00") {
            $bytes = substr($bytes, 1);
        }
        // Left-pad with zeros if shorter than target.
        if (strlen($bytes) < $targetLen) {
            $bytes = str_repeat("\x00", $targetLen - strlen($bytes)) . $bytes;
        }
        return $bytes;
    }
}
