<?php

declare(strict_types=1);

namespace App\Domain\SuperAdmin\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Invitation to the super-admin panel. Token is hashed (SHA-256) — the raw
 * token is shown to the inviter exactly once and emailed to the recipient.
 *
 * @property string $id
 * @property string $email
 * @property string $token_hash
 * @property string $invited_by_user_uuid
 * @property \Illuminate\Support\Carbon|null $accepted_at
 * @property string|null $accepted_by_user_uuid
 * @property \Illuminate\Support\Carbon $expires_at
 * @property \Illuminate\Support\Carbon|null $revoked_at
 * @property array<string, mixed>|null $metadata
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class SuperAdminInvitation extends Model
{
    use HasUuids;

    protected $table = 'super_admin_invitations';

    protected $fillable = [
        'email',
        'token_hash',
        'invited_by_user_uuid',
        'accepted_at',
        'accepted_by_user_uuid',
        'expires_at',
        'revoked_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_uuid', 'uuid');
    }

    public function acceptedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_by_user_uuid', 'uuid');
    }

    public function isPending(): bool
    {
        return $this->accepted_at === null
            && $this->revoked_at === null
            && $this->expires_at->isFuture();
    }

    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }
}
