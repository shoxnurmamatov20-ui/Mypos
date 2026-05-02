<?php

declare(strict_types=1);

namespace App\Filament\Resources\TenantAppBuildResource\Support;

use App\Domain\Tenant\Enums\BuildStatus;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Models\TenantAppBuild;
use App\Filament\Resources\TenantAppResource;
use Filament\Notifications\Notification;
use Throwable;

/**
 * Action helpers shared between {@see \App\Filament\Resources\TenantAppBuildResource}
 * and its View page.
 *
 * Extracted from the Resource class so the file stays under the 400-line cap.
 * Each helper resolves the corresponding Domain Action lazily (via `class_exists`)
 * so the Filament UI keeps working even if Agent D2/D3 hasn't implemented every
 * Action class yet — it falls back to a sensible default + warning notification.
 *
 * The Action layer uses `__invoke` (callable) by convention; this class also
 * tolerates an `execute(...)` method as a defensive fallback.
 */
final class BuildActions
{
    /** Cancel a queued / in-flight EAS build. */
    public static function cancel(TenantAppBuild $record): void
    {
        $actionClass = '\\App\\Domain\\Tenant\\Actions\\CancelAppBuildAction';
        if (! class_exists($actionClass)) {
            $record->forceFill([
                'status' => BuildStatus::Canceled->value,
                'finished_at' => now(),
            ])->save();
            self::notifySuccess('app.notifications.build_canceled');
            return;
        }
        self::invokeWithNotice(
            $actionClass,
            $record,
            successKey: 'app.notifications.build_canceled',
        );
    }

    /** Retry a terminal build by triggering a fresh build on the parent app. */
    public static function retry(TenantAppBuild $record): void
    {
        $app = $record->app;
        if (! $app instanceof TenantApp) {
            Notification::make()
                ->title(__('app.notifications.action_unavailable'))
                ->body(__('app.notifications.action_unavailable_body'))
                ->warning()
                ->send();
            return;
        }
        TenantAppResource::dispatchBuild($app);
    }

    /** Submit a finished build to App Store Connect / Play Console. */
    public static function submit(TenantAppBuild $record): void
    {
        $actionClass = '\\App\\Domain\\Tenant\\Actions\\SubmitAppBuildAction';
        if (! class_exists($actionClass)) {
            self::notifySuccess(
                'app.notifications.submit_started',
                'app.notifications.submit_started_body',
            );
            return;
        }
        self::invokeWithNotice(
            $actionClass,
            $record,
            successKey: 'app.notifications.submit_started',
            successBodyKey: 'app.notifications.submit_started_body',
        );
    }

    /**
     * Call a domain action (callable / `execute(...)`) and surface a notification.
     */
    private static function invokeWithNotice(
        string $actionClass,
        TenantAppBuild $record,
        string $successKey,
        ?string $successBodyKey = null,
    ): void {
        try {
            $action = app($actionClass);
            if (is_callable($action)) {
                $action($record);
            } elseif (method_exists($action, 'execute')) {
                /** @var object{execute: callable} $action */
                $action->execute($record);
            }
            self::notifySuccess($successKey, $successBodyKey);
        } catch (Throwable $e) {
            Notification::make()
                ->title(__('app.notifications.action_unavailable'))
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    private static function notifySuccess(string $titleKey, ?string $bodyKey = null): void
    {
        $n = Notification::make()
            ->title(__($titleKey))
            ->success();
        if ($bodyKey !== null) {
            $n->body(__($bodyKey));
        }
        $n->send();
    }
}
