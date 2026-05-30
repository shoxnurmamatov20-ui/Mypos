<?php

declare(strict_types=1);

namespace App\Events\Employee;

use App\Domain\Employee\Models\Shift;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Spatie\Multitenancy\Jobs\NotTenantAware;

/**
 * Fired when a staff member clocks in (started) or clocks out (ended).
 *
 * Subscribers: web-dashboard staff dashboard (active staff count, KPI tiles).
 */
class ShiftEvent implements NotTenantAware, ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    /**
     * @param  'start'|'end'  $type
     */
    public function __construct(
        public readonly Shift $shift,
        public readonly string $type,
    ) {
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tenant.{$this->shift->tenant_id}.dashboard"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'shift.event';
    }

    /**
     * @return array<string, scalar|null>
     */
    public function broadcastWith(): array
    {
        return [
            'shift_id' => $this->shift->id,
            'tenant_id' => $this->shift->tenant_id,
            'employee_id' => $this->shift->employee_id,
            'type' => $this->type,
            'occurred_at' => now()->toIso8601String(),
        ];
    }
}
