<?php

declare(strict_types=1);

namespace App\Http\Resources\V1\Admin;

use App\Domain\Tenant\Models\TenantAppBuild;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin TenantAppBuild
 */
class AppBuildResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'tenant_app_id' => $this->tenant_app_id,
            'platform' => $this->platform,
            'status' => $this->status,
            'version' => $this->version,
            'build_number' => $this->build_number,
            'build_profile' => $this->build_profile,
            'eas_build_id' => $this->eas_build_id,
            'log_url' => $this->log_url,
            'artifact_url' => $this->artifact_url,
            'error_message' => $this->error_message,
            'started_at' => $this->started_at?->toIso8601String(),
            'finished_at' => $this->finished_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
