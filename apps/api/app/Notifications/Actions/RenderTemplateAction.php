<?php

declare(strict_types=1);

namespace App\Notifications\Actions;

use App\Domain\Notification\Enums\NotificationTemplate;

/**
 * Fills placeholders like {order_no}, {customer_name} in a body template.
 *
 * Uses a simple regex substitution — fast, dependency-free, safe for plain
 * text SMS/push bodies. For rich HTML email, Laravel Mailables should be
 * used directly.
 */
class RenderTemplateAction
{
    /**
     * @param  array<string, scalar|null>  $data
     * @return array{subject: string, body: string}
     */
    public function __invoke(NotificationTemplate $template, array $data): array
    {
        $subject = $this->fill($template->subject(), $data);
        $body = $this->fill($template->bodyTemplate(), $data);

        return ['subject' => $subject, 'body' => $body];
    }

    /**
     * @param  array<string, scalar|null>  $data
     */
    public function fill(string $source, array $data): string
    {
        return preg_replace_callback(
            '/\{([a-z0-9_]+)\}/i',
            static function (array $match) use ($data): string {
                $key = $match[1];
                $value = $data[$key] ?? '';

                return (string) $value;
            },
            $source,
        ) ?? $source;
    }
}
