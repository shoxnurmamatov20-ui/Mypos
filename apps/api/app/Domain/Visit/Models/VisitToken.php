<?php

declare(strict_types=1);

namespace App\Domain\Visit\Models;

use App\Domain\Shared\Concerns\BelongsToTenant;
use App\Domain\Table\Models\Table;
use App\Domain\Table\Models\TableCategory;
use App\Domain\Tenant\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string|null $table_category_id
 * @property string|null $table_id
 * @property int|null $created_by
 * @property string $token_hash
 * @property string|null $visit_reference
 * @property \Illuminate\Support\Carbon $expires_at
 * @property \Illuminate\Support\Carbon|null $used_at
 */
class VisitToken extends Model
{
    use HasUuids;
    use BelongsToTenant;

    protected $table = 'visit_tokens';

    protected $fillable = [
        'tenant_id',
        'table_category_id',
        'table_id',
        'created_by',
        'token_hash',
        'visit_reference',
        'expires_at',
        'used_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    public static function hashRawToken(string $rawToken): string
    {
        return hash_hmac('sha256', $rawToken, (string) config('app.key'));
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TableCategory::class, 'table_category_id');
    }

    public function tableRef(): BelongsTo
    {
        return $this->belongsTo(Table::class, 'table_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
