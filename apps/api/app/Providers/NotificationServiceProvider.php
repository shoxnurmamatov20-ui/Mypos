<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Notification\Enums\NotificationChannel;
use App\Http\Controllers\Api\V1\Notification\NotificationController;
use App\Http\Controllers\Api\V1\Notification\PreferenceController;
use App\Notifications\Drivers\EmailDriver;
use App\Notifications\Drivers\InAppDriver;
use App\Notifications\Drivers\PushDriver;
use App\Notifications\Drivers\SmsDriver;
use App\Notifications\Drivers\TelegramDriver;
use App\Notifications\NotificationManager;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Contracts\Mail\Factory as MailFactory;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class NotificationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton('notifications.manager', function ($app): NotificationManager {
            /** @var ConfigRepository $config */
            $config = $app->make(ConfigRepository::class);
            /** @var MailFactory $mailer */
            $mailer = $app->make(MailFactory::class);

            return new NotificationManager([
                NotificationChannel::Email->value => new EmailDriver($mailer),
                NotificationChannel::SMS->value => new SmsDriver($config),
                NotificationChannel::Push->value => new PushDriver($config),
                NotificationChannel::Telegram->value => new TelegramDriver($config),
                NotificationChannel::InApp->value => new InAppDriver(),
            ]);
        });

        $this->app->alias('notifications.manager', NotificationManager::class);
    }

    public function boot(): void
    {
        $this->registerRoutes();
    }

    private function registerRoutes(): void
    {
        Route::prefix('api/v1/notifications')
            ->middleware(['api', 'auth:sanctum'])
            ->group(function (): void {
                Route::get('/', [NotificationController::class, 'index'])->name('v1.notifications.index');
                Route::patch('/{notification}/read', [NotificationController::class, 'markAsRead'])
                    ->name('v1.notifications.read');
                Route::get('/preferences', [PreferenceController::class, 'index'])
                    ->name('v1.notifications.preferences.index');
                Route::post('/preferences', [PreferenceController::class, 'upsert'])
                    ->name('v1.notifications.preferences.upsert');
                Route::patch('/preferences/{preference}', [PreferenceController::class, 'update'])
                    ->name('v1.notifications.preferences.update');
            });
    }

    /** @return array<int, string> */
    public function provides(): array
    {
        return [
            'notifications.manager',
            NotificationManager::class,
        ];
    }
}
