<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\AI\Exceptions\ChatbotRefusedException;
use App\Domain\AI\Services\ChatbotService;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Services\TierFeatures;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Public\ChatRequest;
use App\Http\Resources\V1\Public\ChatReplyResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Phase-4 — public customer chatbot.
 *
 *   POST /api/v1/public/chat
 *     Body : { message, session_id?, locale? }
 *     Out  : { data: { reply, session_id, refused, reason } }
 *
 * Tenant resolution: requires the `Host` header to map to a verified custom
 * domain via {@see \App\Http\Middleware\ResolveTenantFromDomain} which binds
 * the resolved Tenant to the container as `currentTenant`. Calls hitting
 * platform domains (e.g. mypos.uz) without an explicit tenant are rejected
 * with 404 — there's no "default restaurant" to chat with.
 *
 * Tier gate: Plus+. Lower tiers receive 402 (Payment Required) so the UI
 * can redirect to a static FAQ page rather than burning tokens. The
 * platform itself never consumes its own chatbot — this is a per-tenant
 * customer-facing surface.
 *
 * Rate limiting: 30 messages / hour per IP (set in routes/api.php). The
 * chatbot service additionally enforces a hard upper bound on conversation
 * memory turns so a single session can't accumulate unbounded history.
 *
 * Session lifecycle:
 *   - First call: client omits `session_id`; we mint a UUID and return it.
 *   - Subsequent calls: client echoes the UUID; we fetch the previous
 *     5 turns from {@see \App\Domain\AI\Services\ConversationMemory}.
 *   - Cookies: not set by us — the consumer app stores the id in
 *     localStorage. Switching browsers resets the conversation, which is
 *     acceptable for a stateless customer surface.
 */
class ChatController extends Controller
{
    public function __construct(
        private readonly ChatbotService $chatbot,
    ) {
    }

    public function reply(ChatRequest $request): JsonResponse
    {
        $tenant = $this->resolveTenant();
        $this->ensureTenantCanChat($tenant);

        $sessionId = $request->sessionId() ?? (string) Str::uuid();

        try {
            $result = $this->chatbot->reply(
                tenant: $tenant,
                userMessage: $request->chatMessage(),
                customer: null,            // Public endpoint — no logged-in customer.
                sessionId: $sessionId,
                locale: $request->locale(),
            );
        } catch (ChatbotRefusedException $e) {
            // Polite refusal — render the localised message but flag refused.
            return response()->json([
                'data' => (new ChatReplyResource([
                    'reply' => $e->userMessage,
                    'session_id' => $sessionId,
                    'refused' => true,
                    'reason' => $e->reason,
                ]))->toArray($request),
            ]);
        }

        return response()->json([
            'data' => (new ChatReplyResource([
                'reply' => $result['reply'],
                'session_id' => $sessionId,
                'refused' => false,
                'reason' => null,
            ]))->toArray($request),
        ]);
    }

    /**
     * Pull the active tenant from the IoC container. Set by
     * {@see \App\Http\Middleware\ResolveTenantFromDomain} when the request
     * hits a verified custom domain. Platform-domain traffic without a
     * tenant gets a 404 (not 401 — the endpoint is intentionally public).
     */
    private function resolveTenant(): Tenant
    {
        if (! app()->bound('currentTenant')) {
            throw new NotFoundHttpException('Bu domen biron restoran bilan bog\'lanmagan');
        }

        $tenant = app('currentTenant');
        if (! $tenant instanceof Tenant) {
            throw new NotFoundHttpException('Tenant kontekstida emassiz');
        }
        return $tenant;
    }

    /**
     * 402 Payment Required — the chatbot is Plus+. The HTTP 402 status is
     * deliberately uncommon so the consumer app can render a "this feature
     * is unavailable" UX without confusing it with auth failures (401/403).
     */
    private function ensureTenantCanChat(Tenant $tenant): void
    {
        if (TierFeatures::has($tenant->tier ?? 'free', 'chatbot')) {
            return;
        }

        abort(response()->json([
            'message' => __('Bu restoranda AI suhbat hozircha yoqilmagan'),
            'errors' => [
                'tier' => [__('Restoran Plus+ tarifga ulanishi kerak')],
            ],
        ], Response::HTTP_PAYMENT_REQUIRED));
    }
}
