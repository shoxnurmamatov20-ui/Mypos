<?php

declare(strict_types=1);

namespace App\Domain\Visit\Actions;

use App\Domain\Visit\Models\VisitToken;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Mints a batch of one-time visit tokens for a tenant. Only the sha256 HMAC
 * lands in the database — the raw 48-char token is returned ONCE to the
 * caller (CEO panel prints it as a QR) and can never be recovered later.
 */
class CreateVisitTokenBatchAction
{
    /**
     * @param array{
     *   tenant_id: string,
     *   table_category_id?: string|null,
     *   table_id?: string|null,
     *   visit_reference?: string|null,
     *   ttl_hours?: int|null,
     *   count?: int|null,
     *   created_by?: int|null,
     * } $input
     * @return list<array{id: string, token: string, url: string, expires_at: string}>
     */
    public function execute(array $input): array
    {
        $count = max(1, (int) ($input['count'] ?? 1));
        $expiresAt = Carbon::now()->addHours(max(1, (int) ($input['ttl_hours'] ?? 24)));

        $tokens = [];
        for ($i = 0; $i < $count; $i++) {
            $raw = Str::random(48);

            $token = VisitToken::query()->create([
                'tenant_id' => $input['tenant_id'],
                'table_category_id' => $input['table_category_id'] ?? null,
                'table_id' => $input['table_id'] ?? null,
                'created_by' => $input['created_by'] ?? null,
                'token_hash' => VisitToken::hashRawToken($raw),
                'visit_reference' => $input['visit_reference'] ?? null,
                'expires_at' => $expiresAt,
            ]);

            $tokens[] = [
                'id' => $token->id,
                'token' => $raw,
                'url' => $this->feedbackUrl($raw),
                'expires_at' => $expiresAt->toIso8601String(),
            ];
        }

        return $tokens;
    }

    /** Public guest-feedback URL the QR encodes. */
    private function feedbackUrl(string $rawToken): string
    {
        return rtrim((string) config('app.url'), '/').'/f/'.$rawToken;
    }
}
