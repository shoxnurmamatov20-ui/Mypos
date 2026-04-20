<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Payment\PaymentManager;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PaymentManager::class, fn (): PaymentManager => new PaymentManager());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
