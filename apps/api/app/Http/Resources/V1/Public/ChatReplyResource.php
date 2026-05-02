<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Phase-4 — public chatbot reply payload.
 *
 * Wraps the result of {@see \App\Domain\AI\Services\ChatbotService::reply()}
 * for the consumer-facing endpoint POST /api/v1/public/chat. We deliberately
 * do NOT expose token usage to the public surface — that information is for
 * tenant admins only and lives in `ai_generations_log`.
 */
class ChatReplyResource extends JsonResource
{
    /**
     * @param  array{
     *     reply: string,
     *     session_id: string,
     *     refused: bool,
     *     reason: string|null,
     * }  $resource
     */
    public function __construct(array $resource)
    {
        parent::__construct($resource);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $row = (array) $this->resource;

        return [
            'reply' => (string) ($row['reply'] ?? ''),
            'session_id' => (string) ($row['session_id'] ?? ''),
            // True when the safety filter rejected the input — the UI
            // typically re-styles the bubble to indicate "I can't answer that".
            'refused' => (bool) ($row['refused'] ?? false),
            'reason' => isset($row['reason']) && is_string($row['reason'])
                ? $row['reason']
                : null,
        ];
    }
}
