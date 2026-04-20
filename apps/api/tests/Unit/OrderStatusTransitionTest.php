<?php

declare(strict_types=1);

use App\Domain\Order\Enums\OrderStatus;

it('lists allowed transitions from draft', function (): void {
    expect(OrderStatus::Draft->nextAllowed())
        ->toEqualCanonicalizing([OrderStatus::Pending, OrderStatus::Cancelled]);
});

it('lists allowed transitions from pending', function (): void {
    expect(OrderStatus::Pending->nextAllowed())
        ->toEqualCanonicalizing([OrderStatus::Preparing, OrderStatus::Cancelled]);
});

it('lists allowed transitions from preparing', function (): void {
    expect(OrderStatus::Preparing->nextAllowed())
        ->toEqualCanonicalizing([OrderStatus::Ready, OrderStatus::Cancelled]);
});

it('lists allowed transitions from ready', function (): void {
    expect(OrderStatus::Ready->nextAllowed())
        ->toEqualCanonicalizing([OrderStatus::Served, OrderStatus::Cancelled]);
});

it('lists allowed transitions from served', function (): void {
    expect(OrderStatus::Served->nextAllowed())
        ->toEqualCanonicalizing([OrderStatus::Completed, OrderStatus::Cancelled]);
});

it('lists allowed transitions from completed', function (): void {
    expect(OrderStatus::Completed->nextAllowed())
        ->toEqualCanonicalizing([OrderStatus::Refunded]);
});

it('allows no transitions from cancelled (terminal)', function (): void {
    expect(OrderStatus::Cancelled->nextAllowed())->toBe([]);
});

it('allows no transitions from refunded (terminal)', function (): void {
    expect(OrderStatus::Refunded->nextAllowed())->toBe([]);
});

it('allows valid canTransitionTo lookups', function (): void {
    expect(OrderStatus::Pending->canTransitionTo(OrderStatus::Preparing))->toBeTrue();
    expect(OrderStatus::Preparing->canTransitionTo(OrderStatus::Ready))->toBeTrue();
    expect(OrderStatus::Served->canTransitionTo(OrderStatus::Completed))->toBeTrue();
});

it('rejects invalid canTransitionTo lookups', function (): void {
    expect(OrderStatus::Pending->canTransitionTo(OrderStatus::Ready))->toBeFalse();
    expect(OrderStatus::Pending->canTransitionTo(OrderStatus::Completed))->toBeFalse();
    expect(OrderStatus::Completed->canTransitionTo(OrderStatus::Pending))->toBeFalse();
    expect(OrderStatus::Cancelled->canTransitionTo(OrderStatus::Pending))->toBeFalse();
});

it('returns a string list of values', function (): void {
    $values = OrderStatus::values();
    expect($values)
        ->toContain('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled', 'refunded', 'draft')
        ->toHaveCount(8);
});
