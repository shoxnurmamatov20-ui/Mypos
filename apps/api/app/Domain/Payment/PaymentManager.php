<?php

declare(strict_types=1);

namespace App\Domain\Payment;

use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Providers\CashProvider;
use App\Domain\Payment\Providers\ClickProvider;
use App\Domain\Payment\Providers\PaymentProviderInterface;
use App\Domain\Payment\Providers\PaymeProvider;
use InvalidArgumentException;

/**
 * Resolves payment provider implementations by key.
 *
 * Usage:
 *   $provider = app(PaymentManager::class)->driver('click');
 *   $intent = $provider->createIntent($order);
 */
class PaymentManager
{
    /** @var array<string, PaymentProviderInterface> */
    private array $resolved = [];

    /** @var array<string, class-string<PaymentProviderInterface>> */
    private array $providers = [
        PaymentProvider::Cash->value => CashProvider::class,
        PaymentProvider::Click->value => ClickProvider::class,
        PaymentProvider::Payme->value => PaymeProvider::class,
    ];

    public function driver(string|PaymentProvider $key): PaymentProviderInterface
    {
        $value = $key instanceof PaymentProvider ? $key->value : $key;

        if (! isset($this->providers[$value])) {
            throw new InvalidArgumentException("Unsupported payment provider: {$value}");
        }

        if (! isset($this->resolved[$value])) {
            $class = $this->providers[$value];
            $this->resolved[$value] = app($class);
        }

        return $this->resolved[$value];
    }

    /**
     * Register or override a provider (useful for testing / plugins).
     *
     * @param  class-string<PaymentProviderInterface>  $class
     */
    public function extend(string $key, string $class): void
    {
        $this->providers[$key] = $class;
        unset($this->resolved[$key]);
    }
}
