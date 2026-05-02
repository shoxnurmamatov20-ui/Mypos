<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Actions;

use App\Domain\Tenant\Models\Tenant;
use App\Domain\Tenant\Models\TenantBrand;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Upload a brand image (logo / cover / hero / favicon) to the configured
 * object store and persist the resulting public URL on the brand row.
 *
 * Supported slots — one per allowed brand image column.
 *
 * Storage:
 *   - Disk is `s3` (configured to MinIO via `AWS_*` env). Local dev falls
 *     back to the `public` disk via `FILESYSTEM_DISK=public`.
 *   - Path layout: `tenants/{tenant_id}/brand/{slot}-{rand}.{ext}` so old
 *     uploads can be left behind by a CDN purge job rather than aggressively
 *     deleted (an in-flight render of the previous URL must not 404).
 */
final class UploadBrandImageAction
{
    /** @var array<int, string> */
    public const ALLOWED_SLOTS = [
        'logo',
        'logo_dark',
        'favicon',
        'cover',
        'hero',
        'ogimage',
    ];

    /**
     * Map an API slot name to the brand column that stores its public URL.
     * Kept here (not in the resource) so the controller can stay slot-agnostic.
     */
    private const SLOT_TO_COLUMN = [
        'logo' => 'logo_url',
        'logo_dark' => 'logo_dark_url',
        'favicon' => 'favicon_url',
        'cover' => 'cover_image_url',
        'hero' => 'hero_image_url',
        'ogimage' => 'ogimage_url',
    ];

    /**
     * @return array{brand: TenantBrand, url: string, slot: string, column: string}
     */
    public function execute(Tenant $tenant, string $slot, UploadedFile $file): array
    {
        if (! in_array($slot, self::ALLOWED_SLOTS, true)) {
            throw new \InvalidArgumentException("Unknown brand image slot: {$slot}");
        }

        $column = self::SLOT_TO_COLUMN[$slot];
        $disk = $this->disk();

        $extension = strtolower($file->getClientOriginalExtension() ?: 'png');
        $filename = sprintf('%s-%s.%s', $slot, Str::random(12), $extension);
        $path = sprintf('tenants/%s/brand/%s', $tenant->id, $filename);

        Storage::disk($disk)->putFileAs(
            dirname($path),
            $file,
            basename($path),
            ['visibility' => 'public'],
        );

        $url = Storage::disk($disk)->url($path);

        $brand = TenantBrand::query()
            ->withoutGlobalScopes(['tenant'])
            ->firstOrCreate(
                ['tenant_id' => $tenant->id],
                UpdateBrandAction::defaults($tenant->id),
            );

        $brand->{$column} = $url;
        $brand->save();

        return [
            'brand' => $brand->fresh() ?? $brand,
            'url' => $url,
            'slot' => $slot,
            'column' => $column,
        ];
    }

    /**
     * Resolve the storage disk to use. Production = MinIO (`s3` driver),
     * dev/test fall back to the local `public` disk if `s3` is not configured.
     */
    private function disk(): string
    {
        $configured = (string) config('filesystems.disks.s3.bucket', '');
        if ($configured !== '') {
            return 's3';
        }
        return 'public';
    }
}
