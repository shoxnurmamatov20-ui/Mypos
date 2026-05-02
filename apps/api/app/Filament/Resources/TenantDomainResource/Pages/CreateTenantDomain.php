<?php

declare(strict_types=1);

namespace App\Filament\Resources\TenantDomainResource\Pages;

use App\Domain\Tenant\Actions\CreateCustomDomainAction;
use App\Domain\Tenant\Actions\VerifyDomainAction;
use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantDomain;
use App\Filament\Resources\TenantDomainResource;
use App\Filament\Resources\TenantDomainResource\Schemas\WizardSteps;
use App\Models\User;
use Filament\Forms\Components\Wizard;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Database\Eloquent\Model;

/**
 * Step-by-step wizard for adding a custom domain.
 *
 *   Step 1 — owner enters the hostname and picks the verification method
 *            (TXT or CNAME). Token is generated on form fill.
 *   Step 2 — DNS instructions table (rendered by `WizardSteps`).
 *   Step 3 — owner clicks "Verify" — handled via the `verifyAfterCreate`
 *            hook below: row is persisted first, then `VerifyDomainAction`
 *            runs synchronously.
 *   Step 4 — SSL provisioning state. Placeholder text only — actual ACME
 *            polling is owned by Agent C6 / a background job.
 */
class CreateTenantDomain extends CreateRecord
{
    protected static string $resource = TenantDomainResource::class;

    protected static bool $canCreateAnother = false;

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Wizard::make(WizardSteps::steps())
                    ->columnSpanFull()
                    ->skippable(false)
                    ->submitAction(view('filament.resources.tenant-domain.wizard-submit')),
            ])
            ->statePath('data');
    }

    /**
     * Delegate to the Domain-layer Action so we get the canonical creation
     * path (token generation, soft-delete restore, audit hooks…) instead
     * of inserting via the Eloquent model directly. We then call
     * VerifyDomainAction immediately so the user lands on the View page
     * with accurate status — DNS won't have propagated yet but at least
     * they can see the DNS instructions and the failure reason.
     *
     * @param  array<string, mixed>  $data
     */
    protected function handleRecordCreation(array $data): Model
    {
        $tenant = $this->resolveTenant();
        if ($tenant === null) {
            throw new \RuntimeException('Tenant context could not be resolved.');
        }

        /** @var array{domain: string, verification_method?: string, redirects_to?: string|null} $payload */
        $payload = [
            'domain' => (string) ($data['domain'] ?? ''),
            'verification_method' => (string) ($data['verification_method'] ?? 'txt'),
            'redirects_to' => $data['redirects_to'] ?? null,
        ];

        $record = app(CreateCustomDomainAction::class)->execute($tenant, $payload);

        // Apply primary toggle if requested in the wizard. CreateCustomDomainAction
        // intentionally always inserts with is_primary=false to keep the
        // canonical-redirect contract simple — Filament promotes per the
        // user's explicit checkbox here.
        if (($data['is_primary'] ?? false) === true) {
            TenantDomain::query()
                ->withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('id', '!=', $record->id)
                ->update(['is_primary' => false]);
            $record->forceFill(['is_primary' => true])->save();
        }

        try {
            $result = app(VerifyDomainAction::class)->execute($record);
            $record = $result['domain'] ?? $record;
            if (($result['verified'] ?? false) === false) {
                Notification::make()
                    ->title(__('domain.notifications.verify_failed_title'))
                    ->body((string) ($result['reason'] ?? ''))
                    ->warning()
                    ->send();
            }
        } catch (\Throwable $e) {
            Notification::make()
                ->title(__('domain.notifications.verify_failed_title'))
                ->body($e->getMessage())
                ->warning()
                ->send();
        }

        return $record;
    }

    /**
     * Resolve the tenant the new domain should be associated with.
     * Tenant admins get their own tenant. Super admins must currently
     * impersonate a tenant via Filament's tenancy switcher (out of scope
     * for this wizard) — fall back to picking the first tenant they
     * touched in the EmployeeResource flow if available.
     */
    private function resolveTenant(): ?Tenant
    {
        $user = auth()->user();
        if (! $user instanceof User) {
            return null;
        }
        if ($user->tenant_id !== null) {
            return Tenant::query()->withoutGlobalScopes()->find($user->tenant_id);
        }
        // Super admin without a tenant association: this wizard is not
        // intended for them; the policy layer should already have rejected
        // the request, but as a defensive fallback we pick no tenant.
        return null;
    }

    protected function getRedirectUrl(): string
    {
        return TenantDomainResource::getUrl('view', ['record' => $this->getRecord()]);
    }
}
