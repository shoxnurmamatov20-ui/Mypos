<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Broadcasting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;

/**
 * Channel auth endpoint Reverb (Pusher protocol) calls when a client
 * subscribes to a private/presence channel.
 *
 * Why this exists instead of `Broadcast::routes(['middleware' => ['auth:sanctum']])`:
 *
 *   The default route hard-fails with 401 on missing/invalid tokens. We need
 *   guests (customers tracking an order via tracking_token) to also pass
 *   through so the channel closure in routes/channels.php can decide.
 *
 *   So this controller:
 *     1. Tries to attach a sanctum user IF a Bearer token is present (no 401
 *        if absent — auth is OPTIONAL for the order.{id} channel).
 *     2. Delegates to Laravel's Broadcaster which re-runs the closures from
 *        routes/channels.php and returns the signed payload Reverb expects.
 */
class BroadcastAuthController extends Controller
{
    public function __invoke(Request $request)
    {
        // Soft sanctum auth. If Bearer token is missing this is a no-op — the
        // request continues with $request->user() === null. If the token is
        // present we resolve it so role/tenant checks can run downstream.
        if ($request->bearerToken() !== null && Auth::guard('sanctum')->check()) {
            $request->setUserResolver(static fn () => Auth::guard('sanctum')->user());
        }

        return Broadcast::auth($request);
    }
}
