<?php

declare(strict_types=1);

namespace App\Domain\AI\Models;

use App\Domain\AI\Enums\AiFeature;
use App\Domain\AI\Enums\AiGenerationStatus;
use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only audit row for every Anthropic Messages API call.
 *
 * Why a model rather than a raw insert? — three reasons:
 *   1. Cost dashboards lean on Eloquent aggregations (sum cost_usd by day).
 *   2. The {@see \App\Domain\AI\Services\AiQuotaGuard} counts rows for today
 *      via Eloquent so the quota math respects RLS / soft deletes.
 *   3. Tenant scoping uses the shared {@see BelongsToTenant} trait — keeps
 *      the multi-tenancy guarantee uniform across domains.
 *
 * Tenant-scoped *and* nullable: pre-tenant calls (public onboarding wizard)
 * insert with tenant_id = null. The trait's lenient flag is used by the
 * controller for those rows. RLS policy at the DB level allows null rows
 * to pass the filter so the public endpoint can still write.
 *
 * @property string $id
 * @property string|null $tenant_id
 * @property int|null $user_id
 * @property AiFeature|string $feature
 * @property string $model
 * @property int $input_tokens
 * @property int $output_tokens
 * @property float $cost_usd
 * @property AiGenerationStatus|string $status
 * @property string|null $error_message
 * @property int $duration_ms
 * @property array<string, mixed>|null $request_payload
 * @property array<string, mixed>|null $response_payload
 * @property string|null $ip_address
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Tenant|null $tenant
 * @property-read User|null $user
 */
class AiGenerationLog extends Model
{
    use BelongsToTenant;
    use HasUuids;

    protected $table = 'ai_generations_log';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'feature',
        'model',
        'input_tokens',
        'output_tokens',
        'cost_usd',
        'status',
        'error_message',
        'duration_ms',
        'request_payload',
        'response_payload',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'feature' => AiFeature::class,
            'status' => AiGenerationStatus::class,
            'input_tokens' => 'integer',
            'output_tokens' => 'integer',
            'cost_usd' => 'float',
            'duration_ms' => 'integer',
            'request_payload' => 'array',
            'response_payload' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Total tokens (input + output). Useful for the dashboard chart that
     * shows token-usage trend without separating in/out.
     */
    public function totalTokens(): int
    {
        return (int) $this->input_tokens + (int) $this->output_tokens;
    }
}
