<?php

declare(strict_types=1);

namespace App\Notifications\Actions;

use App\Domain\Notification\Enums\NotificationChannel;
use App\Domain\Notification\Enums\NotificationStatus;
use App\Domain\Notification\Enums\NotificationTemplate;
use App\Domain\Notification\Models\NotificationLog;
use App\Notifications\NotificationManager;

/**
 * Render a template and send it through the given channel driver,
 * recording the full attempt in `notifications_log`.
 */
class SendNotificationAction
{
    public function __construct(
        private readonly NotificationManager $manager,
        private readonly RenderTemplateAction $render,
    ) {
    }

    /**
     * @param  array<string, scalar|null>  $data
     * @param  array<string, mixed>  $extraMeta
     */
    public function __invoke(
        string $tenantId,
        NotificationChannel $channel,
        string $recipient,
        NotificationTemplate $template,
        array $data,
        array $extraMeta = [],
    ): NotificationLog {
        $rendered = ($this->render)($template, $data);

        /** @var NotificationLog $log */
        $log = NotificationLog::query()->create([
            'tenant_id' => $tenantId,
            'channel' => $channel->value,
            'recipient' => $recipient,
            'template' => $template->value,
            'subject' => $rendered['subject'],
            'body' => $rendered['body'],
            'status' => NotificationStatus::Queued->value,
            'metadata' => array_merge(['data' => $data], $extraMeta),
        ]);

        $driver = $this->manager->channel($channel->value);
        $result = $driver->send($recipient, $rendered['subject'], $rendered['body'], $data);

        if (($result['success'] ?? false) === true) {
            $log->markSent($result['provider_message_id'] ?? null);
        } else {
            $log->markFailed((string) ($result['error'] ?? 'unknown_error'));
        }

        return $log->refresh();
    }
}
