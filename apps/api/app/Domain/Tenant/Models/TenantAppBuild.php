<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Enums\BuildStatus;
use App\Domain\Tenant\Enums\SubmissionStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Phase 3 — single EAS Build attempt for a {@see TenantApp}.
 *
 * Created by {@see \App\Domain\Tenant\Actions\GenerateNativeAppAction} when
 * the owner clicks "Generate App"; the actual call to EAS happens inside
 * {@see \App\Jobs\DispatchEasBuildJob} so the HTTP request returns instantly.
 *
 * Lifecycle (string values match {@see BuildStatus}):
 *
 *   queued → in_progress → finished
 *                       ↘ failed | errored | canceled
 *
 * `eas_build_id` is the canonical EAS-side identifier we use to poll status
 * via {@see \App\Domain\Tenant\Services\EasBuildClient}. Populated after
 * `dispatchBuild()` returns; null while the row is `queued` waiting for the
 * job to fire.
 *
 * @property string $id
 * @property string $tenant_id
 * @property string $tenant_app_id
 * @property string $platform                 ios|android|universal
 * @property string $status                   {@see BuildStatus}
 * @property string $submission_status        {@see SubmissionStatus}
 * @property string $version                  semver, e.g. "1.0.1"
 * @property int $build_number                monotonically increasing per app
 * @property string $build_profile            production|preview|development
 * @property string|null $eas_build_id        Expo EAS build UUID
 * @property string|null $eas_project_id      Expo EAS project UUID
 * @property string|null $log_url             EAS-hosted build log URL
 * @property string|null $artifact_url        ipa/aab download URL once finished
 * @property string|null $qr_code_url         install QR for TestFlight / Internal Testing
 * @property string|null $error_message       non-empty when status in [failed, errored]
 * @property string|null $reviewer_notes      Apple/Google reviewer feedback on rejection
 * @property \Illuminate\Support\Carbon|null $started_at
 * @property \Illuminate\Support\Carbon|null $finished_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Tenant $tenant
 * @property-read TenantApp $app
 */
class TenantAppBuild extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;

    protected $table = 'tenant_app_builds';

    protected $fillable = [
        'tenant_id',
        'tenant_app_id',
        'platform',
        'status',
        'submission_status',
        'version',
        'build_number',
        'build_profile',
        'eas_build_id',
        'eas_project_id',
        'log_url',
        'artifact_url',
        'qr_code_url',
        'error_message',
        'reviewer_notes',
        'started_at',
        'finished_at',
        'submitted_at',
    ];

    protected $attributes = [
        'status' => 'queued',
        'submission_status' => 'pending',
        'build_profile' => 'production',
    ];

    protected function casts(): array
    {
        return [
            'build_number' => 'integer',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'submitted_at' => 'datetime',
        ];
    }

    public function app(): BelongsTo
    {
        return $this->belongsTo(TenantApp::class, 'tenant_app_id', 'id');
    }

    public function isInFlight(): bool
    {
        return in_array($this->status, [BuildStatus::Queued->value, BuildStatus::InProgress->value], true);
    }

    public function isTerminal(): bool
    {
        return in_array(
            $this->status,
            [
                BuildStatus::Finished->value,
                BuildStatus::Failed->value,
                BuildStatus::Errored->value,
                BuildStatus::Canceled->value,
            ],
            true,
        );
    }

    public function canBeSubmitted(): bool
    {
        return $this->status === BuildStatus::Finished->value
            && $this->submission_status === SubmissionStatus::Pending->value;
    }
}
