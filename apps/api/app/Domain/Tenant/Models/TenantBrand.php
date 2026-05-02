<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Phase 2 — Tenant Branding (1:1 with tenants).
 *
 * STUB created by Agent C4 to unblock the Filament UI. Migration is owned by
 * Agent C1 (`2026_05_15_000002_create_tenant_brands_table.php`); Agent C3
 * may extend this with computed accessors / scopes — keep the column list in
 * sync with the migration if you replace this file.
 *
 * The PK is `tenant_id`. Filament refers to records by tenant id, not a
 * surrogate id, so we override `$primaryKey`, `$keyType`, and disable
 * auto-increment.
 *
 * @property string $tenant_id
 * @property string $theme
 * @property string|null $logo_url
 * @property string|null $logo_dark_url
 * @property string|null $favicon_url
 * @property string|null $cover_image_url
 * @property string|null $hero_image_url
 * @property string|null $ogimage_url
 * @property string $primary_color
 * @property string $accent_color
 * @property string $text_color
 * @property string $background_color
 * @property string $font_family
 * @property string|null $font_heading
 * @property array<string, string|null>|null $hero_title
 * @property array<string, string|null>|null $hero_subtitle
 * @property array<string, string|null>|null $tagline
 * @property string|null $custom_css
 * @property string|null $instagram_handle
 * @property string|null $facebook_url
 * @property string|null $telegram_handle
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Tenant $tenant
 */
class TenantBrand extends Model
{
    use BelongsToTenant;

    protected $table = 'tenant_brands';

    protected $primaryKey = 'tenant_id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'tenant_id',
        'theme',
        'logo_url',
        'logo_dark_url',
        'favicon_url',
        'cover_image_url',
        'hero_image_url',
        'ogimage_url',
        'primary_color',
        'accent_color',
        'text_color',
        'background_color',
        'font_family',
        'font_heading',
        'hero_title',
        'hero_subtitle',
        'tagline',
        'custom_css',
        'instagram_handle',
        'facebook_url',
        'telegram_handle',
    ];

    protected function casts(): array
    {
        return [
            'hero_title' => 'array',
            'hero_subtitle' => 'array',
            'tagline' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }
}
