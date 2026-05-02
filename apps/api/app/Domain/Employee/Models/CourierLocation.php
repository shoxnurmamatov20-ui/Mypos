<?php

declare(strict_types=1);

namespace App\Domain\Employee\Models;

use App\Domain\Order\Models\Order;
use App\Domain\Shared\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $employee_id
 * @property string|null $order_id
 * @property string $lat
 * @property string $lng
 * @property string|null $accuracy_meters
 * @property string|null $heading
 * @property string|null $speed_mps
 * @property int|null $battery_percent
 * @property \Illuminate\Support\Carbon $recorded_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Employee|null $employee
 * @property-read Order|null $order
 */
class CourierLocation extends Model
{
    use HasUuids;
    use BelongsToTenant;

    protected $table = 'courier_locations';

    protected $fillable = [
        'tenant_id',
        'employee_id',
        'order_id',
        'lat',
        'lng',
        'accuracy_meters',
        'heading',
        'speed_mps',
        'battery_percent',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'decimal:7',
            'lng' => 'decimal:7',
            'accuracy_meters' => 'decimal:2',
            'heading' => 'decimal:2',
            'speed_mps' => 'decimal:2',
            'battery_percent' => 'integer',
            'recorded_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
