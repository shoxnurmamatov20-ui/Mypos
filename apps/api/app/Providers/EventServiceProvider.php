<?php

declare(strict_types=1);

namespace App\Providers;

use App\Events\Order\OrderPlaced;
use App\Listeners\NotifyOnOrderPlaced;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        OrderPlaced::class => [
            NotifyOnOrderPlaced::class,
        ],
    ];

    public function boot(): void
    {
        parent::boot();
    }
}
