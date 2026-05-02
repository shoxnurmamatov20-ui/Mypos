<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| C7 — Phase 2 — Tier feature gates
|--------------------------------------------------------------------------
|
| Spec covered (Agent C3):
|   The `TierFeatures` service answers "can this tenant do X" for the four
|   capability tiers (free / pro / plus / enterprise). It is consumed by:
|     - Admin API controllers (BrandController, DomainController)
|     - Filament resources (visual gating + warnings)
|     - The marketing wizard (offers the right plan upgrade)
|
| Capability matrix:
|
|   tier         | sub-domain | adv-brand | custom-domain | custom-css | multi-domain
|   -------------|------------|-----------|---------------|------------|--------------
|   free         |     no     |    no     |      no       |     no     |     no
|   pro          |    yes     |   yes     |      no       |     no     |     no
|   plus         |    yes     |   yes     |     yes       |    yes     |     no
|   enterprise   |    yes     |   yes     |     yes       |    yes     |    yes
|
| If a tenant's `tier_expires_at` is in the past, the runtime should treat
| them as Free until billing renews. We assert that grace via the optional
| API endpoint (`GET /admin/tier-features`) when wired, otherwise just hit
| the underlying service.
*/

use App\Domain\Tenant\Enums\TenantTier;
use App\Domain\Tenant\Services\TierFeatures;

it('Free tier cannot use any premium feature', function (): void {
    $features = TierFeatures::for(TenantTier::Free);

    expect($features->canUseCustomSubdomain())->toBeFalse();
    expect($features->canUseAdvancedBranding())->toBeFalse();
    expect($features->canUseCustomDomain())->toBeFalse();
    expect($features->canUseCustomCss())->toBeFalse();
    expect($features->canUseMultipleDomains())->toBeFalse();
});

it('Pro tier enables sub-domain and advanced branding only', function (): void {
    $features = TierFeatures::for(TenantTier::Pro);

    expect($features->canUseCustomSubdomain())->toBeTrue();
    expect($features->canUseAdvancedBranding())->toBeTrue();
    expect($features->canUseCustomDomain())->toBeFalse();
    expect($features->canUseCustomCss())->toBeFalse();
    expect($features->canUseMultipleDomains())->toBeFalse();
});

it('Plus tier adds custom domain + custom CSS', function (): void {
    $features = TierFeatures::for(TenantTier::Plus);

    expect($features->canUseCustomSubdomain())->toBeTrue();
    expect($features->canUseAdvancedBranding())->toBeTrue();
    expect($features->canUseCustomDomain())->toBeTrue();
    expect($features->canUseCustomCss())->toBeTrue();
    expect($features->canUseMultipleDomains())->toBeFalse();
});

it('Enterprise tier unlocks every capability including multi-domain', function (): void {
    $features = TierFeatures::for(TenantTier::Enterprise);

    expect($features->canUseCustomSubdomain())->toBeTrue();
    expect($features->canUseAdvancedBranding())->toBeTrue();
    expect($features->canUseCustomDomain())->toBeTrue();
    expect($features->canUseCustomCss())->toBeTrue();
    expect($features->canUseMultipleDomains())->toBeTrue();
});

it('atLeast() respects the canonical tier ordering', function (): void {
    expect(TenantTier::Enterprise->atLeast(TenantTier::Plus))->toBeTrue();
    expect(TenantTier::Plus->atLeast(TenantTier::Pro))->toBeTrue();
    expect(TenantTier::Pro->atLeast(TenantTier::Free))->toBeTrue();

    expect(TenantTier::Free->atLeast(TenantTier::Pro))->toBeFalse();
    expect(TenantTier::Pro->atLeast(TenantTier::Plus))->toBeFalse();
    expect(TenantTier::Plus->atLeast(TenantTier::Enterprise))->toBeFalse();
});

it('TierFeatures::for() coerces unknown strings to Free (defensive default)', function (): void {
    $features = TierFeatures::for('garbage');
    expect($features->canUseCustomDomain())->toBeFalse();
});

it('TierFeatures::for() coerces null to Free (defensive default)', function (): void {
    $features = TierFeatures::for(null);
    expect($features->canUseCustomDomain())->toBeFalse();
});

it('TierFeatures::for() accepts a string tier and resolves correctly', function (): void {
    $features = TierFeatures::for('plus');
    expect($features->canUseCustomDomain())->toBeTrue();
});

it('GET /admin/tier-features returns the feature matrix for the current tenant', function (): void {
    if (! \Illuminate\Support\Facades\Route::has('v1.admin.tier_features')) {
        $this->markTestSkipped('Tier features endpoint not yet wired (pending C3).');
    }

    $owner = actingAsTenantOwner();
    $owner->tenant->forceFill(['tier' => 'plus'])->save();
    \Laravel\Sanctum\Sanctum::actingAs($owner);

    $this->getJson('/api/v1/admin/tier-features')
        ->assertOk()
        ->assertJsonPath('data.can_use_custom_domain', true)
        ->assertJsonPath('data.can_use_custom_css', true)
        ->assertJsonPath('data.can_use_multiple_domains', false);
});

it('expired tier (tier_expires_at < now) falls back to Free in the API response', function (): void {
    if (! \Illuminate\Support\Facades\Route::has('v1.admin.tier_features')) {
        $this->markTestSkipped('Tier features endpoint not yet wired (pending C3).');
    }

    $owner = actingAsTenantOwner();
    $owner->tenant->update([
        'tier' => 'plus',
        'tier_expires_at' => now()->subDay(),
    ]);
    \Laravel\Sanctum\Sanctum::actingAs($owner);

    $response = $this->getJson('/api/v1/admin/tier-features')->assertOk();

    expect($response->json('data.can_use_custom_domain'))->toBeFalse();
});
