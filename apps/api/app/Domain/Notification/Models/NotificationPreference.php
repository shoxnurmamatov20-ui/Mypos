<?php

declare(strict_types=1);

namespace App\Domain\Notification\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $user_uuid
 * @property string $channel
 * @property string|null $template
 * @property bool $enabled
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class NotificationPreference extends Model
{
    use HasUuids;

    protected $table = 'notification_preferences';

    protected $fillable = [
        'user_uuid',
        'channel',
        'template',
        'enabled',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_uuid', 'uuid');
    }

    /**
     * Check if a given user wants this (channel, template) combination.
     * Missing row = default-enabled.
     */
    public static function isEnabled(string $userUuid, string $channel, string $template): bool
    {
        $row = self::query()
            ->where('user_uuid', $userUuid)
            ->where('channel', $channel)
            ->where(function ($q) use ($template) {
                $q->where('template', $template)->orWhereNull('template');
            })
            ->orderByRaw('template IS NULL')
            ->first();

        return $row === null ? true : (bool) $row->enabled;
    }
}
