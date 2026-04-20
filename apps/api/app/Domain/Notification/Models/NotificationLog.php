<?php

declare(strict_types=1);

namespace App\Domain\Notification\Models;

use App\Domain\Notification\Enums\NotificationStatus;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Database\Factories\NotificationLogFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $channel
 * @property string $recipient
 * @property string $template
 * @property string|null $subject
 * @property string $body
 * @property string $status
 * @property string|null $provider_message_id
 * @property string|null $error_message
 * @property array<string, mixed>|null $metadata
 * @property \Illuminate\Support\Carbon|null $sent_at
 * @property \Illuminate\Support\Carbon|null $delivered_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class NotificationLog extends Model
{
    /** @use HasFactory<NotificationLogFactory> */
    use HasFactory;
    use HasUuids;
    use BelongsToTenant;

    protected $table = 'notifications_log';

    protected $fillable = [
        'tenant_id',
        'channel',
        'recipient',
        'template',
        'subject',
        'body',
        'status',
        'provider_message_id',
        'error_message',
        'metadata',
        'sent_at',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'sent_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function markSent(?string $providerMessageId = null): void
    {
        $this->update([
            'status' => NotificationStatus::Sent->value,
            'provider_message_id' => $providerMessageId,
            'sent_at' => now(),
        ]);
    }

    public function markFailed(string $error): void
    {
        $this->update([
            'status' => NotificationStatus::Failed->value,
            'error_message' => $error,
        ]);
    }

    public function markDelivered(): void
    {
        $this->update([
            'status' => NotificationStatus::Delivered->value,
            'delivered_at' => now(),
        ]);
    }

    public function markRead(): void
    {
        if ($this->status === NotificationStatus::Read->value) {
            return;
        }
        $this->update(['status' => NotificationStatus::Read->value]);
    }

    protected static function newFactory(): NotificationLogFactory
    {
        return NotificationLogFactory::new();
    }
}
