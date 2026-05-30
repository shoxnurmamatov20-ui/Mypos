<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\Customer\Actions\SubmitOrderReviewAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Customer-facing review submission. Authenticated via tracking_token
 * (anonymous customer) or auth:sanctum (signed-in customer).
 */
class PublicOrderReviewController extends Controller
{
    public function store(Request $request, SubmitOrderReviewAction $action): JsonResource
    {
        $data = $request->validate([
            'order_id' => ['required', 'string', 'uuid'],
            'tracking_token' => ['nullable', 'string'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'food_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'delivery_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $review = $action($data);

        return new JsonResource($review);
    }
}
