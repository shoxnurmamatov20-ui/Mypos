<?php

declare(strict_types=1);

namespace App\Filament\Resources\KioskDeviceResource\Schemas;

use App\Domain\Kiosk\Enums\KioskDeviceStatus;
use App\Domain\Kiosk\Models\KioskDevice;
use Filament\Forms;

/**
 * Form schema for the KioskDeviceResource.
 *
 * Edit-only fields (status, paired_at, etc.) are placed inside a separate
 * read-only section that becomes visible after the device is created.
 * The only writable fields are display preferences and operational
 * metadata — pairing/status flow through dedicated row Actions.
 */
final class KioskDeviceFormSchema
{
    /** @return array<int, Forms\Components\Component> */
    public static function sections(): array
    {
        return [
            self::deviceSection(),
            self::statusSection(),
        ];
    }

    public static function deviceSection(): Forms\Components\Section
    {
        return Forms\Components\Section::make('Qurilma')
            ->description("Kiosk qurilmasining nomi va ko'rinishi")
            ->schema([
                Forms\Components\TextInput::make('name')
                    ->label('Nomi')
                    ->required()
                    ->maxLength(128)
                    ->placeholder("Masalan: Kiosk-1, Kassa yonidagi ekran"),
                Forms\Components\TextInput::make('location_label')
                    ->label('Joylashuv')
                    ->maxLength(128)
                    ->placeholder("Masalan: Asosiy kirish, Drive-thru..."),
                Forms\Components\TextInput::make('idle_timeout_seconds')
                    ->label("Bo'sh vaqt taymeri (sek)")
                    ->numeric()
                    ->default(60)
                    ->minValue(10)
                    ->maxValue(600)
                    ->step(5)
                    ->required()
                    ->helperText("Foydalanuvchi harakatsiz qolganda bosh ekranga qaytadi"),
                Forms\Components\Select::make('language')
                    ->label('Til')
                    ->options([
                        'uz' => "O'zbekcha",
                        'ru' => 'Русский',
                        'en' => 'English',
                    ])
                    ->default('uz')
                    ->required(),
                Forms\Components\Select::make('theme')
                    ->label('Mavzu')
                    ->options([
                        'light' => "Yorug'",
                        'dark' => "Qorong'i",
                    ])
                    ->default('light')
                    ->required(),
                Forms\Components\Textarea::make('notes')
                    ->label('Izoh')
                    ->maxLength(2000)
                    ->rows(3)
                    ->columnSpanFull(),
            ])
            ->columns(2);
    }

    public static function statusSection(): Forms\Components\Section
    {
        return Forms\Components\Section::make("Status (faqat ko'rish)")
            ->description("Pairing va aktivlik holati. O'zgartirish uchun yon paneldagi amallardan foydalaning.")
            ->visibleOn('edit')
            ->schema([
                Forms\Components\Placeholder::make('status_display')
                    ->label('Holati')
                    ->content(fn (?KioskDevice $record): string => $record !== null
                        ? (KioskDeviceStatus::tryFrom($record->status)?->label() ?? $record->status)
                        : '—'),
                Forms\Components\Placeholder::make('device_token_last4_display')
                    ->label('Token (oxirgi 4)')
                    ->content(fn (?KioskDevice $record): string => $record?->device_token_last4 !== null
                        ? '****' . $record->device_token_last4
                        : '—'),
                Forms\Components\Placeholder::make('paired_at_display')
                    ->label('Bog\'langan vaqti')
                    ->content(fn (?KioskDevice $record): string => $record?->paired_at
                        ?->translatedFormat('d.m.Y H:i') ?? '—'),
                Forms\Components\Placeholder::make('last_seen_at_display')
                    ->label("Oxirgi ko'rinish")
                    ->content(fn (?KioskDevice $record): string => self::formatLastSeen($record)),
                Forms\Components\Placeholder::make('last_ip_address_display')
                    ->label('Oxirgi IP')
                    ->content(fn (?KioskDevice $record): string => $record?->last_ip_address ?? '—'),
                Forms\Components\KeyValue::make('device_info')
                    ->label('Qurilma haqida')
                    ->disabled()
                    ->dehydrated(false)
                    ->keyLabel('Maydon')
                    ->valueLabel('Qiymat')
                    ->columnSpanFull(),
            ])
            ->columns(2);
    }

    private static function formatLastSeen(?KioskDevice $record): string
    {
        if ($record === null || $record->last_seen_at === null) {
            return '—';
        }
        $abs = $record->last_seen_at->translatedFormat('d.m.Y H:i');
        $rel = $record->last_seen_at->diffForHumans();
        return $abs . ' (' . $rel . ')';
    }
}
