<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Notification\Enums\NotificationChannel;
use App\Domain\Notification\Enums\NotificationStatus;
use App\Domain\Notification\Enums\NotificationTemplate;
use App\Domain\Notification\Models\NotificationLog;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<NotificationLog> */
class NotificationLogFactory extends Factory
{
    protected $model = NotificationLog::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'channel' => NotificationChannel::InApp->value,
            'recipient' => fake()->email(),
            'template' => NotificationTemplate::OrderPlaced->value,
            'subject' => 'Buyurtma qabul qilindi',
            'body' => 'Buyurtmangiz qabul qilindi.',
            'status' => NotificationStatus::Queued->value,
            'metadata' => ['data' => ['order_no' => 'O000001']],
        ];
    }

    public function sent(): static
    {
        return $this->state(fn () => [
            'status' => NotificationStatus::Sent->value,
            'sent_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn () => [
            'status' => NotificationStatus::Failed->value,
            'error_message' => 'test error',
        ]);
    }
}
