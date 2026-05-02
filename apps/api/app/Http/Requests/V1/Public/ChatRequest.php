<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Public;

use App\Domain\AI\Services\ChatSafetyFilter;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Phase-4 — POST /api/v1/public/chat body validation.
 *
 * Body:
 *   - `message`     (required) — 1..ChatSafetyFilter::MAX_USER_INPUT_CHARS chars.
 *                                 Trimmed; emojis allowed; HTML tolerated but the
 *                                 model is instructed to ignore them.
 *   - `session_id`  (optional) — opaque client-generated id (UUID-ish, 8..64
 *                                 chars). When omitted the controller mints
 *                                 a fresh UUID and returns it; subsequent
 *                                 calls echo it back to retain context.
 *   - `locale`      (optional) — output language. Default 'uz'.
 *
 * The endpoint is *unauthenticated*. The tier gate (Plus+ only) is enforced
 * downstream by the controller using {@see TierFeatures}, against the tenant
 * resolved by {@see \App\Http\Middleware\ResolveTenantFromDomain}.
 */
class ChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Public endpoint — IP throttling enforced at the route, tier check
        // happens in the controller after the tenant is resolved.
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'message' => [
                'required',
                'string',
                'min:1',
                'max:' . ChatSafetyFilter::MAX_USER_INPUT_CHARS,
            ],
            'session_id' => [
                'sometimes',
                'nullable',
                'string',
                'min:8',
                'max:64',
                'regex:/^[A-Za-z0-9_\-]+$/',
            ],
            'locale' => [
                'sometimes',
                'string',
                Rule::in(['uz', 'ru', 'en']),
            ],
        ];
    }

    public function chatMessage(): string
    {
        return (string) $this->validated()['message'];
    }

    public function sessionId(): ?string
    {
        $value = $this->validated()['session_id'] ?? null;
        return is_string($value) && $value !== '' ? $value : null;
    }

    public function locale(): string
    {
        $value = $this->validated()['locale'] ?? null;
        return is_string($value) && $value !== '' ? $value : 'uz';
    }
}
