<?php

declare(strict_types=1);

use App\Domain\Notification\Enums\NotificationChannel;
use App\Domain\Notification\Enums\NotificationStatus;
use App\Domain\Notification\Enums\NotificationTemplate;
use App\Domain\Notification\Models\NotificationLog;
use App\Domain\Notification\Models\NotificationPreference;
use App\Jobs\SendNotificationJob;
use App\Notifications\Actions\RenderTemplateAction;
use App\Notifications\Actions\SendNotificationAction;
use App\Notifications\Drivers\PushDriver;
use App\Notifications\Drivers\SmsDriver;
use App\Notifications\Drivers\TelegramDriver;
use App\Notifications\NotificationManager;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;

it('renders templates with placeholder substitution', function (): void {
    $render = app(RenderTemplateAction::class);

    $result = $render(NotificationTemplate::OrderPlaced, [
        'order_no' => 'O260420-0001',
        'customer_name' => 'Ali',
        'total' => '50 000',
    ]);

    expect($result['subject'])->toContain('O260420-0001');
    expect($result['body'])->toContain('Ali');
    expect($result['body'])->toContain('50 000');
});

it('sends SMS in simulated mode when Eskiz creds are missing', function (): void {
    config([
        'services.eskiz.email' => null,
        'services.eskiz.password' => null,
    ]);

    $owner = actingAsTenantOwner();
    $send = app(SendNotificationAction::class);

    $log = $send(
        tenantId: $owner->tenant_id,
        channel: NotificationChannel::SMS,
        recipient: '+998901112233',
        template: NotificationTemplate::OrderReady,
        data: ['order_no' => 'O260420-0002', 'customer_name' => 'Vali'],
    );

    expect($log->status)->toBe(NotificationStatus::Sent->value);
    expect($log->channel)->toBe('sms');
    expect($log->recipient)->toBe('+998901112233');
});

it('calls the Eskiz HTTP flow with correct payload when creds are set', function (): void {
    config([
        'services.eskiz.base_url' => 'https://notify.eskiz.uz/api',
        'services.eskiz.email' => 'bot@example.com',
        'services.eskiz.password' => 'secret',
    ]);

    Http::fake([
        'notify.eskiz.uz/api/auth/login' => Http::response(['data' => ['token' => 'fake-token']], 200),
        'notify.eskiz.uz/api/message/sms/send' => Http::response(['id' => 'msg-42', 'status' => 'waiting'], 200),
    ]);

    $driver = new SmsDriver(app('config'));
    $result = $driver->send('+998901112233', 'subj', 'Hello Ali');

    expect($result['success'])->toBeTrue();
    expect($result['provider_message_id'] ?? null)->toBe('msg-42');

    Http::assertSent(function ($request): bool {
        return str_contains($request->url(), 'message/sms/send')
            && $request['mobile_phone'] === '+998901112233'
            && $request['message'] === 'Hello Ali';
    });
});

it('calls the Expo push endpoint with the correct payload', function (): void {
    Http::fake([
        'exp.host/*' => Http::response(['data' => ['id' => 'push-1']], 200),
    ]);

    $driver = new PushDriver(app('config'));
    $result = $driver->send('ExponentPushToken[abc]', 'Tayyor', 'Buyurtmangiz tayyor');

    expect($result['success'])->toBeTrue();
    Http::assertSent(function ($request): bool {
        $data = $request->data();
        return str_contains($request->url(), 'exp.host/--/api/v2/push/send')
            && ($data['to'] ?? null) === 'ExponentPushToken[abc]'
            && ($data['title'] ?? null) === 'Tayyor'
            && ($data['body'] ?? null) === 'Buyurtmangiz tayyor';
    });
});

it('calls the Telegram bot API when a bot token is configured', function (): void {
    config(['services.telegram.bot_token' => 'FAKE:TOKEN']);

    Http::fake([
        'api.telegram.org/*' => Http::response(['ok' => true, 'result' => ['message_id' => 7]], 200),
    ]);

    $driver = new TelegramDriver(app('config'));
    $result = $driver->send('12345', 'Hi', 'Xabar');

    expect($result['success'])->toBeTrue();
    expect($result['provider_message_id'] ?? null)->toBe('7');
    Http::assertSent(function ($request): bool {
        $data = $request->data();
        return str_contains($request->url(), 'sendMessage')
            && ($data['chat_id'] ?? null) === '12345'
            && ($data['parse_mode'] ?? null) === 'Markdown';
    });
});

it('records a notification row for in-app channel and supports markAsRead', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);
    $send = app(SendNotificationAction::class);

    $log = $send(
        tenantId: $owner->tenant_id,
        channel: NotificationChannel::InApp,
        recipient: $owner->uuid,
        template: NotificationTemplate::OrderPlaced,
        data: ['order_no' => 'O260420-0100', 'customer_name' => $owner->name, 'total' => '10000'],
    );

    $this->getJson('/api/v1/notifications')
        ->assertOk()
        ->assertJsonPath('data.0.id', $log->id);

    $this->patchJson("/api/v1/notifications/{$log->id}/read")
        ->assertOk()
        ->assertJsonPath('data.status', NotificationStatus::Read->value);

    expect(NotificationLog::query()->find($log->id)->status)
        ->toBe(NotificationStatus::Read->value);
});

it('allows the authenticated user to manage their notification preferences', function (): void {
    $owner = actingAsTenantOwner();
    Sanctum::actingAs($owner);

    /** @var NotificationPreference $pref */
    $pref = NotificationPreference::query()->create([
        'user_uuid' => $owner->uuid,
        'channel' => NotificationChannel::Email->value,
        'template' => NotificationTemplate::OrderPlaced->value,
        'enabled' => true,
    ]);

    $this->getJson('/api/v1/notifications/preferences')
        ->assertOk()
        ->assertJsonPath('data.0.id', $pref->id);

    $this->patchJson("/api/v1/notifications/preferences/{$pref->id}", [
        'channel' => NotificationChannel::Email->value,
        'template' => NotificationTemplate::OrderPlaced->value,
        'enabled' => false,
    ])
        ->assertOk()
        ->assertJsonPath('data.enabled', false);
});

it('dispatches SendNotificationJob when the OrderPlaced listener runs', function (): void {
    Queue::fake();

    $owner = actingAsTenantOwner();

    $order = \App\Domain\Order\Models\Order::factory()->create([
        'tenant_id' => $owner->tenant_id,
        'employee_id' => $owner->uuid,
    ]);

    $listener = app(\App\Listeners\NotifyOnOrderPlaced::class);
    $listener->handle(new \App\Events\Order\OrderPlaced($order));

    Queue::assertPushed(SendNotificationJob::class, function (SendNotificationJob $job) use ($owner): bool {
        return $job->tenantId === $owner->tenant_id
            && $job->template === NotificationTemplate::OrderPlaced->value;
    });
});

it('registers all drivers in the NotificationManager', function (): void {
    /** @var NotificationManager $manager */
    $manager = app('notifications.manager');

    foreach (NotificationChannel::cases() as $channel) {
        expect($manager->has($channel))->toBeTrue("{$channel->value} driver registered");
    }
});
