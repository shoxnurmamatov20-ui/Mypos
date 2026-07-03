<?php

declare(strict_types=1);

namespace App\Domain\Customer\Actions;

use App\Domain\Customer\Models\OrderReview;
use App\Domain\Order\Models\Order;
use App\Events\Customer\ReviewPosted;
use App\Support\TenantGuc;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmitOrderReviewAction
{
    /**
     * @param  array{
     *   order_id: string,
     *   tracking_token?: string|null,
     *   rating: int,
     *   food_rating?: int|null,
     *   delivery_rating?: int|null,
     *   comment?: string|null,
     *   customer_id?: string|null,
     * }  $input
     */
    public function __invoke(array $input): OrderReview
    {
        $review = DB::transaction(function () use ($input): OrderReview {
            // Guest submissions arrive with no tenant context; the order id +
            // tracking token pair is the credential, so locate the row under
            // a one-shot RLS wildcard, then pin the request to its tenant.
            /** @var Order|null $order */
            $order = TenantGuc::scoped(TenantGuc::WILDCARD, fn () => Order::query()
                ->withoutGlobalScopes(['tenant'])
                ->whereKey($input['order_id'])
                ->first());

            if ($order === null) {
                throw ValidationException::withMessages([
                    'order_id' => ['Order not found'],
                ]);
            }

            // Guest reviews must authenticate via the unguessable tracking_token.
            $token = $input['tracking_token'] ?? null;
            $authenticatedAsTenant = auth()->check()
                && auth()->user()?->tenant_id === $order->tenant_id;
            $authenticatedAsGuest = is_string($token)
                && $token !== ''
                && $order->tracking_token !== null
                && hash_equals((string) $order->tracking_token, $token);

            if (! $authenticatedAsTenant && ! $authenticatedAsGuest) {
                throw ValidationException::withMessages([
                    'auth' => ['Unauthorized to review this order'],
                ]);
            }

            TenantGuc::imprint((string) $order->tenant_id);

            // One review per order — repeat submission updates instead of duplicates.
            return OrderReview::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'tenant_id' => $order->tenant_id,
                    'customer_id' => $input['customer_id'] ?? $order->customer_id,
                    'rating' => max(1, min(5, (int) $input['rating'])),
                    'food_rating' => isset($input['food_rating']) ? max(1, min(5, (int) $input['food_rating'])) : null,
                    'delivery_rating' => isset($input['delivery_rating']) ? max(1, min(5, (int) $input['delivery_rating'])) : null,
                    'comment' => $input['comment'] ?? null,
                ],
            );
        });

        event(new ReviewPosted(
            $review->id,
            $review->tenant_id,
            $review->order_id,
            $review->rating,
            $review->comment,
        ));

        return $review;
    }
}
