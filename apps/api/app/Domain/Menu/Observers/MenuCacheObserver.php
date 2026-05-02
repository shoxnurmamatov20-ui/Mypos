<?php

declare(strict_types=1);

namespace App\Domain\Menu\Observers;

use App\Domain\Menu\Models\MenuCategory;
use App\Domain\Menu\Models\MenuItem;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Bust the public-menu / public-restaurant cache whenever:
 *   - a MenuItem or MenuCategory is created/updated/deleted (menu cache only)
 *   - a Tenant is updated/deleted (restaurant detail + listing cache)
 *
 * Cache keys live in:
 *   - public:menu:{tenant_id}             — full menu payload
 *   - public:menu:etag:{tenant_id}        — etag stored alongside the payload
 *   - public:restaurant:{slug}            — single restaurant detail
 *   - public:restaurants:list             — listing index versioning marker
 *
 * The listing cache is keyed by query params (search, cuisine, sort, …); we
 * rely on a cheap version-bump trick: bumping `public:restaurants:version`
 * effectively invalidates every cached listing slice without having to
 * enumerate them. See PublicRestaurantController.
 */
class MenuCacheObserver
{
    public function created(Model $model): void
    {
        $this->bustFor($model);
    }

    public function updated(Model $model): void
    {
        $this->bustFor($model);
    }

    public function deleted(Model $model): void
    {
        $this->bustFor($model);
    }

    public function restored(Model $model): void
    {
        $this->bustFor($model);
    }

    private function bustFor(Model $model): void
    {
        if ($model instanceof MenuItem || $model instanceof MenuCategory) {
            $tenantId = (string) $model->tenant_id;
            if ($tenantId !== '') {
                Cache::forget("public:menu:{$tenantId}");
                Cache::forget("public:menu:etag:{$tenantId}");
            }
            // Menu changes don't generally affect the restaurant listing
            // (cuisine/rating live on Tenant.settings), so don't bump the
            // listing version here.
            return;
        }

        if ($model instanceof Tenant) {
            $slug = (string) $model->slug;
            if ($slug !== '') {
                Cache::forget("public:restaurant:{$slug}");
            }
            // Listing payload uses cuisine/cover/rating from settings — bump.
            Cache::increment('public:restaurants:version');
        }
    }
}
