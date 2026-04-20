<?php

declare(strict_types=1);

namespace App\Events\Order;

use App\Domain\Order\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderPlaced
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public readonly Order $order)
    {
    }
}
