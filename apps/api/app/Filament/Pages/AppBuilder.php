<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domain\Tenant\Actions\GenerateNativeAppAction;
use App\Domain\Tenant\Enums\AppPlatform;
use App\Domain\Tenant\Enums\AppStatus;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantApp;
use App\Domain\Tenant\Services\TierFeatures;
use App\Filament\Pages\AppBuilder\AppBuilderWizardSchema;
use App\Filament\Resources\TenantAppResource;
use App\Models\User;
use Filament\Actions\Action;
use Filament\Forms\Components\Wizard;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Support\Exceptions\Halt;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * App Builder — first-time setup wizard for the white-labelled native app.
 *
 * Four steps:
 *   1. Pick platform (Universal / iOS / Android).
 *   2. App identity (auto-suggested from tenant.name + tenant.slug).
 *   3. Visual assets (icon — splash + adaptive icon are auto-generated).
 *   4. Build account (MyPOS Build Service vs Bring-Your-Own).
 *
 * On submit:
 *   - Creates ONE {@see TenantApp} row when the user picked iOS or Android.
 *   - Creates TWO rows (one ios + one android) when the user picked Universal,
 *     so each platform gets its own bundle id and metadata bucket. The web
 *     UI later treats them as siblings via {@see TenantAppResource}.
 *   - Dispatches the first build per row via {@see GenerateNativeAppAction}.
 *
 * Tier gate: this page is hidden from navigation for Free/Pro tenants and
 * `canAccess()` rejects them at the routing layer. Super admins always see
 * the wizard for support purposes.
 *
 * @property-read Form $form
 */
class AppBuilder extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-sparkles';

    protected static ?string $navigationGroup = 'Settings';

    protected static ?int $navigationSort = 14;

    protected static string $view = 'filament.pages.app-builder';

    protected static ?string $slug = 'app-builder';

    /** @var array<string, mixed> */
    public array $data = [];

    public static function getNavigationLabel(): string
    {
        return __('app.nav.wizard');
    }

    public function getTitle(): string
    {
        return __('app.wizard.title');
    }

    public function getHeading(): string
    {
        return __('app.wizard.title');
    }

    public function getSubheading(): ?string
    {
        return __('app.wizard.description');
    }

    /**
     * Tier-gated visibility: hidden for Free / Pro tenants. Super admins
     * always see the wizard so they can demo / debug for any tenant.
     */
    public static function shouldRegisterNavigation(): bool
    {
        return self::canAccess();
    }

    public static function canAccess(): bool
    {
        $user = auth()->user();
        if (! $user instanceof User) {
            return false;
        }
        if ($user->is_super_admin === true) {
            return true;
        }
        $tenant = $user->tenant;
        if ($tenant === null) {
            return false;
        }
        return TierFeatures::for($tenant->getAttribute('tier'))->canUseNativeApp();
    }

    public function mount(): void
    {
        $this->form->fill([
            'platform' => AppPlatform::Universal->value,
            'app_name' => $this->resolveTenant()?->name ?? '',
            'bundle_id' => AppBuilderWizardSchema::suggestBundleId($this->resolveTenant()),
            'description' => ['uz' => '', 'ru' => '', 'en' => ''],
            'build_account' => 'mypos',
            'adaptive_icon_bg' => '#ffffff',
        ]);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Wizard::make(AppBuilderWizardSchema::steps($this->resolveTenant()))
                    ->skippable(false)
                    ->persistStepInQueryString('app-builder-step')
                    ->submitAction(view('filament.pages.app-builder-submit')),
            ])
            ->statePath('data');
    }

    /**
     * Wizard submit handler. Creates one or two TenantApp rows depending on
     * the selected platform, then triggers the first build for each.
     */
    public function submit(): void
    {
        try {
            $this->callHook('beforeValidate');
            $data = $this->form->getState();
            $this->callHook('afterValidate');

            $tenant = $this->resolveTenant();
            if ($tenant === null) {
                throw new Halt('Tenant context could not be resolved.');
            }

            if (! TierFeatures::for($tenant->getAttribute('tier'))->canUseNativeApp()
                && ! $this->isSuperAdmin()) {
                throw new Halt('Tier does not support native apps.');
            }

            /** @var array<int, TenantApp> $created */
            $created = DB::transaction(fn (): array => $this->createApps($tenant, $data));

            foreach ($created as $app) {
                $this->dispatchFirstBuild($app);
            }

            Notification::make()
                ->title(__('app.notifications.created'))
                ->body(__('app.notifications.build_started_body'))
                ->success()
                ->send();

            $this->redirect(TenantAppResource::getUrl('index'));
        } catch (Halt) {
            return;
        } catch (Throwable $e) {
            Notification::make()
                ->title(__('app.notifications.action_unavailable'))
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<int, TenantApp>
     */
    private function createApps(Tenant $tenant, array $data): array
    {
        $platformValue = (string) ($data['platform'] ?? AppPlatform::Universal->value);
        $platforms = $this->expandPlatforms($platformValue);

        $created = [];
        foreach ($platforms as $platform) {
            $created[] = $this->createSingleApp($tenant, $platform, $data);
        }
        return $created;
    }

    /**
     * Universal -> [iOS, Android] (one row per platform), so each store's
     * bundle id, metadata, and review timeline can diverge over time.
     * iOS / Android stay as singletons.
     *
     * @return array<int, AppPlatform>
     */
    private function expandPlatforms(string $platformValue): array
    {
        $enum = AppPlatform::tryFrom($platformValue) ?? AppPlatform::Universal;
        return match ($enum) {
            AppPlatform::Universal => [AppPlatform::Ios, AppPlatform::Android],
            AppPlatform::Ios => [AppPlatform::Ios],
            AppPlatform::Android => [AppPlatform::Android],
        };
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function createSingleApp(Tenant $tenant, AppPlatform $platform, array $data): TenantApp
    {
        $app = new TenantApp();
        $app->forceFill([
            'tenant_id' => $tenant->id,
            'platform' => $platform->value,
            'app_name' => (string) ($data['app_name'] ?? $tenant->name),
            'short_name' => self::nullableString($data['short_name'] ?? null),
            'bundle_id' => (string) ($data['bundle_id'] ?? AppBuilderWizardSchema::suggestBundleId($tenant)),
            'description' => self::asArray($data['description'] ?? []),
            'keywords' => self::asArray($data['keywords'] ?? []),
            'icon_url' => self::nullableString($data['icon_url'] ?? null),
            'adaptive_icon_bg' => $platform === AppPlatform::Android
                ? self::nullableString($data['adaptive_icon_bg'] ?? '#ffffff')
                : null,
            'google_package_name' => $platform === AppPlatform::Android
                ? (string) ($data['bundle_id'] ?? '')
                : null,
            'build_account' => (string) ($data['build_account'] ?? 'mypos'),
            'status' => AppStatus::Configuring->value,
        ])->save();

        return $app;
    }

    /**
     * Triggers the first EAS Build via the canonical Action layer.
     * Errors are surfaced inline (notification) rather than aborting the
     * wizard — the row is already created and the owner can retry from
     * {@see TenantAppResource}.
     */
    private function dispatchFirstBuild(TenantApp $app): void
    {
        if (! class_exists(GenerateNativeAppAction::class)) {
            return;
        }
        try {
            /** @var GenerateNativeAppAction $action */
            $action = app(GenerateNativeAppAction::class);
            $platform = $app->platform instanceof AppPlatform
                ? $app->platform
                : (AppPlatform::tryFrom((string) $app->platform) ?? AppPlatform::Universal);
            $action($app, $platform);
        } catch (Throwable $e) {
            Notification::make()
                ->title(__('app.notifications.action_unavailable'))
                ->body($e->getMessage())
                ->warning()
                ->send();
        }
    }

    /** @return array<int, Action> */
    protected function getHeaderActions(): array
    {
        return [
            Action::make('back_to_apps')
                ->label(__('app.nav.apps'))
                ->icon('heroicon-o-arrow-uturn-left')
                ->color('gray')
                ->url(fn (): string => TenantAppResource::getUrl('index')),
        ];
    }

    private function resolveTenant(): ?Tenant
    {
        $user = auth()->user();
        if (! $user instanceof User) {
            return null;
        }
        if ($user->tenant_id === null) {
            return null;
        }
        return Tenant::query()
            ->withoutGlobalScopes()
            ->find($user->tenant_id);
    }

    private function isSuperAdmin(): bool
    {
        $user = auth()->user();
        return $user instanceof User && $user->is_super_admin === true;
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $str = is_scalar($value) ? (string) $value : '';
        return $str === '' ? null : $str;
    }

    /**
     * @return array<int|string, mixed>
     */
    private static function asArray(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }
        return [];
    }
}
