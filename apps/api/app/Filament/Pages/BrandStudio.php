<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Domain\Tenant\Actions\UpdateBrandAction;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantBrand;
use App\Filament\Pages\BrandStudio\BrandFormSchema;
use App\Models\User;
use Filament\Actions\Action;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Support\Exceptions\Halt;
use Throwable;

/**
 * Brand Studio — single-page editor for the per-tenant TenantBrand row.
 *
 * Layout:
 *   - Left column: form sections (theme, logos, colors, typography, hero
 *     copy, custom CSS, social). Components are reactive (`->live()`)
 *     so the right-side preview can react.
 *   - Right column (Blade view): preview card showing logo + hero + sample
 *     menu, re-rendered as form state changes.
 *
 * Tenant resolution:
 *   - Regular tenant admins → editing their own tenant.
 *   - Super admins → top-bar Select binds `selectedTenantId` and reloads
 *     the form when changed.
 *
 * Persistence delegates to {@see UpdateBrandAction} (Domain layer).
 *
 * @property-read Form $form
 */
class BrandStudio extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-paint-brush';

    protected static ?string $navigationGroup = 'Settings';

    protected static ?int $navigationSort = 10;

    protected static string $view = 'filament.pages.brand-studio';

    protected static ?string $slug = 'brand-studio';

    /** @var array<string, mixed> */
    public array $data = [];

    public ?string $selectedTenantId = null;

    public static function getNavigationLabel(): string
    {
        return __('brand.nav.label');
    }

    public function getTitle(): string
    {
        return __('brand.page.title');
    }

    public static function canAccess(): bool
    {
        $user = auth()->user();
        if (! $user instanceof User) {
            return false;
        }
        // Tenant admins or super admins can access. Tenant scope is then
        // resolved per request via `resolveTenant()`.
        return $user->is_super_admin === true || $user->tenant_id !== null;
    }

    public function mount(): void
    {
        $tenant = $this->resolveTenant();
        $this->selectedTenantId = $tenant?->id;
        $this->fillFormForTenant($tenant);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema(BrandFormSchema::sections($this->resolveTenant()))
            ->statePath('data');
    }

    /** Triggered by the super-admin tenant selector at the top of the page. */
    public function updatedSelectedTenantId(?string $value): void
    {
        if ($value === null || ! $this->isSuperAdmin()) {
            return;
        }
        $tenant = Tenant::query()
            ->withoutGlobalScopes()
            ->find($value);
        $this->fillFormForTenant($tenant);
    }

    public function save(): void
    {
        try {
            $this->callHook('beforeValidate');
            $data = $this->form->getState();
            $this->callHook('afterValidate');

            $tenant = $this->resolveTenant();
            if ($tenant === null) {
                throw new Halt('Tenant context could not be resolved.');
            }

            app(UpdateBrandAction::class)->execute($tenant, $data);

            Notification::make()
                ->title(__('brand.saved.title'))
                ->body(__('brand.saved.body'))
                ->success()
                ->send();
        } catch (Halt) {
            return;
        } catch (Throwable $e) {
            Notification::make()
                ->title(__('brand.error.title'))
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    /** @return array<int, Action> */
    protected function getHeaderActions(): array
    {
        return [
            Action::make('save')
                ->label(__('brand.actions.save'))
                ->icon('heroicon-o-check')
                ->keyBindings(['mod+s'])
                ->action('save'),
            Action::make('preview')
                ->label(__('brand.actions.open_preview'))
                ->icon('heroicon-o-arrow-top-right-on-square')
                ->color('gray')
                ->url(fn (): ?string => $this->getPreviewUrl(), shouldOpenInNewTab: true)
                ->visible(fn (): bool => $this->getPreviewUrl() !== null),
        ];
    }

    /** Used by the Blade view to render the live-preview pane. */
    public function getPreviewState(): array
    {
        return [
            'data' => $this->data,
            'tenant' => $this->resolveTenant()?->only(['id', 'slug', 'name']),
            'preview_url' => $this->getPreviewUrl(),
        ];
    }

    /** @return array<string, mixed> */
    protected function getViewData(): array
    {
        return [
            'previewState' => $this->getPreviewState(),
            'isSuperAdmin' => $this->isSuperAdmin(),
        ];
    }

    private function fillFormForTenant(?Tenant $tenant): void
    {
        if ($tenant === null) {
            $this->form->fill([]);
            return;
        }
        $brand = TenantBrand::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->first();
        $this->form->fill($brand?->toArray() ?? ['theme' => 'modern']);
    }

    private function resolveTenant(): ?Tenant
    {
        $user = auth()->user();
        if (! $user instanceof User) {
            return null;
        }
        if ($user->is_super_admin === true) {
            if ($this->selectedTenantId === null) {
                return null;
            }
            return Tenant::query()
                ->withoutGlobalScopes()
                ->find($this->selectedTenantId);
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

    private function getPreviewUrl(): ?string
    {
        $tenant = $this->resolveTenant();
        if ($tenant === null || empty($tenant->slug)) {
            return null;
        }
        $base = (string) config('app.preview_url', 'https://preview.mypos.uz');
        return rtrim($base, '/') . "/{$tenant->slug}";
    }
}
