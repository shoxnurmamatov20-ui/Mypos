<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Notification\Enums\NotificationChannel;
use App\Domain\Notification\Enums\NotificationTemplate;
use App\Domain\Notification\Models\NotificationLog;
use App\Notifications\Actions\SendNotificationAction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Spatie\Multitenancy\Jobs\NotTenantAware;

/**
 * Queued shipping job — invokes SendNotificationAction for a single
 * (tenant, channel, recipient, template, data) tuple.
 *
 * Carries its own tenantId, so it opts out of Spatie's automatic tenant
 * binding via {@see NotTenantAware}.
 */
class SendNotificationJob implements ShouldQueue, NotTenantAware
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $backoff = 10;

    /**
     * @param  array<string, scalar|null>  $data
     * @param  array<string, mixed>  $extraMeta
     */
    public function __construct(
        public readonly string $tenantId,
        public readonly string $channel,
        public readonly string $recipient,
        public readonly string $template,
        public readonly array $data = [],
        public readonly array $extraMeta = [],
    ) {
    }

    public function handle(SendNotificationAction $send): NotificationLog
    {
        return $send(
            tenantId: $this->tenantId,
            channel: NotificationChannel::from($this->channel),
            recipient: $this->recipient,
            template: NotificationTemplate::from($this->template),
            data: $this->data,
            extraMeta: $this->extraMeta,
        );
    }
}
