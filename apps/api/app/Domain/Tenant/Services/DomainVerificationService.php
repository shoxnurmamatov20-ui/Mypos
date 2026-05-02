<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Services;

use Illuminate\Support\Str;

/**
 * DNS-based ownership verification for custom restaurant domains.
 *
 * Two methods are supported:
 *
 *   - "txt"   — owner adds a TXT record at `_mypos.<domain>` whose value
 *               equals the row's `verification_token`. Lowest friction —
 *               works on every DNS provider, no zone-edit permission games.
 *
 *   - "cname" — owner points the apex (or a subdomain) at one of our
 *               *.mypos.uz canonical hosts. We read the CNAME and accept
 *               anything ending in `mypos.uz`. Useful when the owner wants
 *               us to also serve the apex.
 *
 * IMPORTANT: `dns_get_record()` is **blocking**. Real-world authoritative
 * resolvers can take seconds. Always invoke this service from a queued
 * job (see {@see \App\Jobs\VerifyDomainJob}), never from an HTTP request.
 */
class DomainVerificationService
{
    private const TOKEN_PREFIX = 'mypos-verify-';
    private const TXT_HOST_PREFIX = '_mypos.';
    private const CANONICAL_TARGET_SUFFIX = 'mypos.uz';

    /**
     * Generate a fresh, opaque, unguessable verification token. Stored on
     * the `tenant_domains` row at creation time and proved via DNS.
     */
    public function generateVerificationToken(): string
    {
        return self::TOKEN_PREFIX . Str::random(48);
    }

    /**
     * Probe `_mypos.<domain>` for a TXT record whose value matches the
     * expected token. Returns true on first match, false on any failure
     * (DNS NXDOMAIN, SERVFAIL, no TXT records, value mismatch).
     */
    public function verifyTxtRecord(string $domain, string $expectedToken): bool
    {
        if ($expectedToken === '') {
            return false;
        }

        $records = $this->lookup(self::TXT_HOST_PREFIX . $domain, DNS_TXT);
        if ($records === []) {
            return false;
        }

        foreach ($records as $record) {
            // PHP returns TXT chunks in `txt`, but multi-chunk records
            // are split into `entries` (array). Accept either form.
            $candidates = [];
            if (isset($record['txt']) && is_string($record['txt'])) {
                $candidates[] = $record['txt'];
            }
            if (isset($record['entries']) && is_array($record['entries'])) {
                $candidates[] = implode('', array_map('strval', $record['entries']));
            }

            foreach ($candidates as $value) {
                if (hash_equals($expectedToken, trim($value))) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Resolve the CNAME chain at `<domain>` (or `www.<domain>` as fallback)
     * and accept if any target ends in `mypos.uz`.
     */
    public function verifyCnameRecord(string $domain): bool
    {
        $records = $this->lookup($domain, DNS_CNAME);
        if ($records === []) {
            // Apex CNAMEs are illegal in classic DNS — many owners will set
            // `www` instead. Try that as a fallback before giving up.
            $records = $this->lookup('www.' . $domain, DNS_CNAME);
        }

        foreach ($records as $record) {
            $target = strtolower((string) ($record['target'] ?? ''));
            if ($target === '') {
                continue;
            }
            $target = rtrim($target, '.');
            if (str_ends_with($target, self::CANONICAL_TARGET_SUFFIX)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Wrap PHP's blocking DNS resolver so callers don't need to deal with
     * `false` returns or PHP warnings on lookup failure.
     *
     * @return list<array<string, mixed>>
     */
    private function lookup(string $hostname, int $type): array
    {
        // dns_get_record() throws warnings on resolver failure — suppress
        // them; we treat any failure as "not verified" anyway.
        $records = @dns_get_record($hostname, $type);
        if (! is_array($records)) {
            return [];
        }
        return $records;
    }
}
