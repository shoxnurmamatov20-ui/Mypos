<?php

declare(strict_types=1);

namespace App\Domain\AI\Services;

use Illuminate\Support\Facades\Cache;

/**
 * Phase-4 — Redis-backed short-term memory for the customer chatbot.
 *
 * Each session keeps a bounded ring-buffer of the most recent turns. The
 * Anthropic Messages API is stateless, so this class is the *only* place
 * that decides "how much history to send back".
 *
 * Contract (referenced by Agents E5 + E7):
 *
 *   append(string $sessionId, array $turn): void
 *   history(string $sessionId, int $maxTurns = 5): array
 *   clear(string $sessionId): void
 *
 * Storage:
 *   - Key:   `chatbot:mem:{tenantId}:{sessionId}`  (tenant-scoped to avoid
 *            cross-restaurant collision if the same session_id is reused)
 *   - Value: JSON-encoded list of `{ role, content, ts }` entries.
 *   - TTL:   sliding 1 hour — every append refreshes it.
 *   - Cap:   the buffer is trimmed to {@see HARD_CAP} on append so a runaway
 *            client can't DoS Redis memory.
 *
 * `role` is always `'user'` or `'assistant'` so the array can be passed
 * verbatim to {@see \App\Domain\AI\Contracts\AnthropicClientContract::conversation()}.
 */
final class ConversationMemory
{
    /** Hard cap on stored turns (regardless of `maxTurns` requested). */
    private const HARD_CAP = 20;

    /** Sliding TTL in seconds (1 hour). */
    private const TTL_SECONDS = 3600;

    /**
     * Append a single turn to the conversation.
     *
     * @param  array{role: string, content: string}  $turn
     */
    public function append(string $tenantId, string $sessionId, array $turn): void
    {
        if ($sessionId === '' || ! in_array($turn['role'] ?? '', ['user', 'assistant'], true)) {
            return;
        }
        $content = (string) ($turn['content'] ?? '');
        if ($content === '') {
            return;
        }

        $key = $this->key($tenantId, $sessionId);
        $existing = $this->read($key);

        $existing[] = [
            'role' => $turn['role'],
            'content' => $content,
            'ts' => time(),
        ];

        // Trim from the head so the buffer is the most-recent N turns.
        if (count($existing) > self::HARD_CAP) {
            $existing = array_slice($existing, -self::HARD_CAP);
        }

        Cache::put($key, $existing, self::TTL_SECONDS);
    }

    /**
     * Return the most recent `$maxTurns` turns as a Messages-API-shaped array.
     *
     * @return array<int, array{role: string, content: string}>
     */
    public function history(string $tenantId, string $sessionId, int $maxTurns = 5): array
    {
        if ($sessionId === '') {
            return [];
        }
        $maxTurns = max(0, min($maxTurns, self::HARD_CAP));

        $stored = $this->read($this->key($tenantId, $sessionId));
        if ($stored === []) {
            return [];
        }

        // Each stored entry has { role, content, ts } — strip ts before
        // returning so the array is directly usable by the Messages API.
        $tail = array_slice($stored, -$maxTurns);

        $out = [];
        foreach ($tail as $entry) {
            $out[] = [
                'role' => (string) $entry['role'],
                'content' => (string) $entry['content'],
            ];
        }
        return $out;
    }

    /** Clear the conversation buffer. Used by an explicit "reset chat" UI. */
    public function clear(string $tenantId, string $sessionId): void
    {
        if ($sessionId === '') {
            return;
        }
        Cache::forget($this->key($tenantId, $sessionId));
    }

    /**
     * @return list<array{role: string, content: string, ts: int}>
     */
    private function read(string $key): array
    {
        $raw = Cache::get($key);
        if (! is_array($raw)) {
            return [];
        }

        $out = [];
        foreach ($raw as $entry) {
            if (! is_array($entry)) {
                continue;
            }
            $role = (string) ($entry['role'] ?? '');
            $content = (string) ($entry['content'] ?? '');
            if ($content === '' || ! in_array($role, ['user', 'assistant'], true)) {
                continue;
            }
            $out[] = [
                'role' => $role,
                'content' => $content,
                'ts' => (int) ($entry['ts'] ?? 0),
            ];
        }
        return $out;
    }

    private function key(string $tenantId, string $sessionId): string
    {
        // Trim to keep cache-key length sane; UUID/v4 is 36 chars.
        return 'chatbot:mem:' . $tenantId . ':' . substr($sessionId, 0, 64);
    }
}
