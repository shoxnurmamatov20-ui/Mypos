<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Actions;

use App\Domain\SuperAdmin\Enums\AuditSeverity;
use App\Domain\SuperAdmin\Enums\SubscriptionPlan;
use App\Domain\SuperAdmin\Enums\SubscriptionStatus;
use App\Domain\SuperAdmin\Services\AuditLogger;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

/**
 * Creates a Tenant + owner User in a single transaction.
 */
class CreateTenantAction
{
    /**
     * @param array{
     *   name: string,
     *   slug: string,
     *   owner_name: string,
     *   owner_email: string,
     *   owner_phone?: string|null,
     *   owner_password: string,
     *   plan?: string|null,
     *   trial_days?: int|null,
     *   default_locale?: string|null,
     *   default_currency?: string|null,
     *   timezone?: string|null,
     *   notes?: string|null,
     * } $input
     *
     * @return array{tenant: Tenant, owner: User}
     */
    public function __invoke(User $superAdmin, array $input): array
    {
        $slug = Str::slug($input['slug']);
        if (Tenant::query()->withoutGlobalScopes()->where('slug', $slug)->exists()) {
            throw ValidationException::withMessages([
                'slug' => [__('Bu slug band')],
            ]);
        }

        if (User::query()->where('email', $input['owner_email'])->exists()) {
            throw ValidationException::withMessages([
                'owner_email' => [__('Bu email allaqachon ishlatilgan')],
            ]);
        }

        $plan = $input['plan'] ?? SubscriptionPlan::Starter->value;
        $trialDays = $input['trial_days'] ?? 14;
        $now = now();

        return DB::transaction(function () use ($input, $slug, $plan, $trialDays, $now, $superAdmin): array {
            $tenant = Tenant::create([
                'slug' => $slug,
                'name' => $input['name'],
                'plan' => $plan,
                'subscription_plan' => $plan,
                'status' => SubscriptionStatus::Trialing->value,
                'subscription_status' => SubscriptionStatus::Trialing->value,
                'mrr_minor' => 0,
                'default_locale' => $input['default_locale'] ?? 'uz',
                'default_currency' => $input['default_currency'] ?? 'UZS',
                'timezone' => $input['timezone'] ?? 'Asia/Tashkent',
                'phone' => $input['owner_phone'] ?? null,
                'email' => $input['owner_email'],
                'trial_ends_at' => $trialDays > 0 ? $now->copy()->addDays($trialDays) : null,
                'last_active_at' => $now,
                'notes' => $input['notes'] ?? null,
            ]);

            $owner = User::create([
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $tenant->id,
                'name' => $input['owner_name'],
                'email' => $input['owner_email'],
                'phone' => $input['owner_phone'] ?? null,
                'locale' => $input['default_locale'] ?? 'uz',
                'password' => Hash::make($input['owner_password']),
                'is_super_admin' => false,
            ]);

            // Assign owner role on `web` guard (matches existing factory behaviour).
            Role::findOrCreate('owner', 'web');
            $owner->assignRole('owner');

            AuditLogger::log('tenant.created', [
                'actor_user' => $superAdmin,
                'tenant_id' => $tenant->id,
                'subject_type' => 'tenant',
                'subject_id' => $tenant->id,
                'subject_label' => $tenant->name,
                'severity' => AuditSeverity::Info->value,
                'metadata' => [
                    'plan' => $plan,
                    'owner_email' => $owner->email,
                    'trial_days' => $trialDays,
                ],
            ]);

            return ['tenant' => $tenant->fresh(), 'owner' => $owner->fresh()];
        });
    }
}
