<?php

declare(strict_types=1);

namespace App\Filament\Widgets;

use App\Domain\Kiosk\Enums\KioskDeviceStatus;
use App\Domain\Kiosk\Models\KioskDevice;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

/**
 * Live status of all kiosks for the current tenant.
 *
 * Refreshes via Echo broadcast events (`kiosk.paired`, `kiosk.unpaired`,
 * `kiosk.heartbeat`, `kiosk.disabled`) on the `tenant.{id}.dashboard`
 * private channel — no polling. Status colour reflects KioskDeviceStatus,
 * while the "since last seen" colour highlights stale heartbeats
 * independently — a paired device that hasn't reported in >5 min is shown
 * in warning.
 */
class ActiveKiosksWidget extends TableWidget
{
    protected static ?string $heading = 'Kiosklar holati';

    protected int|string|array $columnSpan = 'full';

    protected static ?int $sort = 6;

    /**
     * Polling removed (audit H4) — refreshed via Echo broadcasts when a
     * kiosk pairs/unpairs or sends a heartbeat.
     */
    protected static ?string $pollingInterval = null;

    /** @return array<string, string> */
    public function getListeners(): array
    {
        $tenantId = optional(auth()->user())->tenant_id;
        if ($tenantId === null) {
            return [];
        }
        return [
            "echo-private:tenant.{$tenantId}.dashboard,.kiosk.paired" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.kiosk.unpaired" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.kiosk.heartbeat" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.kiosk.disabled" => '$refresh',
        ];
    }

    public function table(Table $table): Table
    {
        return $table
            ->query(self::query())
            ->defaultSort('last_seen_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Nomi')
                    ->weight('semibold')
                    ->searchable(),
                Tables\Columns\TextColumn::make('location_label')
                    ->label('Joylashuv')
                    ->placeholder('—'),
                Tables\Columns\TextColumn::make('status')
                    ->label('Holati')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => KioskDeviceStatus::tryFrom($state)?->label() ?? $state)
                    ->color(fn (string $state): string => KioskDeviceStatus::tryFrom($state)?->color() ?? 'gray'),
                Tables\Columns\TextColumn::make('language')
                    ->label('Til')
                    ->formatStateUsing(fn (?string $state): string => self::languageLabel($state))
                    ->placeholder('—'),
                Tables\Columns\TextColumn::make('idle_timeout_seconds')
                    ->label('Idle')
                    ->state(fn (KioskDevice $record): string => $record->idle_timeout_seconds . 's')
                    ->color('gray'),
                Tables\Columns\TextColumn::make('last_seen_at')
                    ->label("Oxirgi ko'rinish")
                    ->state(fn (KioskDevice $record): string => self::formatLastSeen($record))
                    ->badge()
                    ->color(fn (KioskDevice $record): string => self::lastSeenColor($record))
                    ->sortable(),
            ])
            ->paginated([5, 10, 25])
            ->emptyStateHeading('Kiosklar topilmadi')
            ->emptyStateDescription("Yangi kiosk yaratish uchun 'Kiosklar' bo'limiga o'ting");
    }

    /** @return Builder<KioskDevice> */
    protected static function query(): Builder
    {
        if (! Schema::hasTable('kiosk_devices')) {
            // Defensive: empty query if migration hasn't run yet.
            return KioskDevice::query()->whereRaw('1 = 0');
        }
        return KioskDevice::query();
    }

    private static function formatLastSeen(KioskDevice $record): string
    {
        if ($record->last_seen_at === null) {
            return 'Hech qachon';
        }
        return $record->last_seen_at->diffForHumans();
    }

    private static function lastSeenColor(KioskDevice $record): string
    {
        if ($record->status === KioskDeviceStatus::Disabled->value) {
            return 'danger';
        }
        if ($record->status === KioskDeviceStatus::Unpaired->value) {
            return 'gray';
        }
        if ($record->last_seen_at === null) {
            return 'warning';
        }
        $diffMinutes = (int) $record->last_seen_at->diffInMinutes(now());
        if ($diffMinutes <= 5) {
            return 'success';
        }
        if ($diffMinutes <= 30) {
            return 'warning';
        }
        return 'danger';
    }

    private static function languageLabel(?string $code): string
    {
        return match ($code) {
            'uz' => "O'zbekcha",
            'ru' => 'Русский',
            'en' => 'English',
            default => '—',
        };
    }
}
