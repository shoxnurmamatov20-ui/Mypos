<?php

declare(strict_types=1);

namespace App\Events\Inventory;

use App\Domain\Inventory\Models\Ingredient;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Spatie\Multitenancy\Jobs\NotTenantAware;

/**
 * Fired when an ingredient's current_stock falls at or below min_stock.
 *
 * Subscribers: web-dashboard inventory page (toast + invalidate cache),
 * mobile-staff chef role (warning banner).
 */
class LowStockAlert implements NotTenantAware, ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly Ingredient $ingredient,
        public readonly float $currentStock,
        public readonly float $minStock,
    ) {
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tenant.{$this->ingredient->tenant_id}.dashboard"),
            new PrivateChannel("tenant.{$this->ingredient->tenant_id}.kitchen"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'inventory.low_stock';
    }

    /**
     * @return array<string, scalar|null>
     */
    public function broadcastWith(): array
    {
        return [
            'ingredient_id' => $this->ingredient->id,
            'tenant_id' => $this->ingredient->tenant_id,
            'name' => (string) ($this->ingredient->name['uz'] ?? $this->ingredient->name['en'] ?? ''),
            'unit' => $this->ingredient->unit,
            'current' => $this->currentStock,
            'min' => $this->minStock,
        ];
    }
}
