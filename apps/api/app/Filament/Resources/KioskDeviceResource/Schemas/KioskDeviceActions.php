<?php

declare(strict_types=1);

namespace App\Filament\Resources\KioskDeviceResource\Schemas;

use App\Domain\Kiosk\Actions\GeneratePairingCodeAction;
use App\Domain\Kiosk\Enums\KioskDeviceStatus;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Kiosk\Models\KioskPairingCode;
use Filament\Notifications\Notification;
use Filament\Tables;
use Illuminate\Support\Facades\Auth;

/**
 * Row & bulk action factories for the KioskDeviceResource.
 *
 * Lifecycle is split between four Actions: pairing-code generation,
 * disable, re-enable, and force-unpair. Each is gated by the
 * KioskDevicePolicy custom abilities.
 */
final class KioskDeviceActions
{
    /** @return array<int, Tables\Actions\Action|Tables\Actions\ActionGroup> */
    public static function rowActions(): array
    {
        return [
            Tables\Actions\ActionGroup::make([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                self::generatePairingCodeAction(),
                self::disableAction(),
                self::reEnableAction(),
                self::forceUnpairAction(),
                Tables\Actions\DeleteAction::make(),
                Tables\Actions\RestoreAction::make(),
            ]),
        ];
    }

    /** @return array<int, Tables\Actions\BulkAction|Tables\Actions\BulkActionGroup> */
    public static function bulkActions(): array
    {
        return [
            Tables\Actions\BulkActionGroup::make([
                Tables\Actions\BulkAction::make('bulkDisable')
                    ->label("Tanlanganlarni o'chirish")
                    ->icon('heroicon-o-no-symbol')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('Tanlangan kiosklarni faolsizlantirish')
                    ->modalDescription("Token rad etiladi. Qayta yoqish uchun 'Re-enable' ishlatiladi.")
                    ->action(function ($records): void {
                        $count = 0;
                        foreach ($records as $device) {
                            /** @var KioskDevice $device */
                            if ($device->status !== KioskDeviceStatus::Disabled->value) {
                                $device->update(['status' => KioskDeviceStatus::Disabled->value]);
                                $count++;
                            }
                        }
                        Notification::make()
                            ->title("{$count} ta qurilma o'chirildi")
                            ->success()
                            ->send();
                    }),
                Tables\Actions\DeleteBulkAction::make(),
                Tables\Actions\RestoreBulkAction::make(),
            ]),
        ];
    }

    public static function generatePairingCodeAction(): Tables\Actions\Action
    {
        return Tables\Actions\Action::make('generatePairingCode')
            ->label('Kod yaratish')
            ->icon('heroicon-o-key')
            ->color('primary')
            ->visible(fn (KioskDevice $record): bool => self::canGenerateCode($record))
            ->modalHeading('Pairing kod yaratish')
            ->modalDescription("Yangi 6 raqamli kod yaratiladi va 15 daqiqa amal qiladi. Kodni kiosk qurilmasiga kiriting.")
            ->modalSubmitActionLabel('Yaratish')
            ->action(function (KioskDevice $record): void {
                $tenant = $record->tenant;
                if ($tenant === null) {
                    Notification::make()
                        ->title('Tenant topilmadi')
                        ->danger()
                        ->send();
                    return;
                }
                $action = app(GeneratePairingCodeAction::class);
                $code = $action($tenant, Auth::user());

                Notification::make()
                    ->title('Kod yaratildi: ' . self::formatCode($code->code))
                    ->body(
                        "Kodni kiosk ekraniga kiriting. Amal qilish vaqti: "
                        . $code->expires_at->translatedFormat('H:i') . "."
                    )
                    ->success()
                    ->persistent()
                    ->send();
            });
    }

    public static function disableAction(): Tables\Actions\Action
    {
        return Tables\Actions\Action::make('disable')
            ->label("O'chirish")
            ->icon('heroicon-o-no-symbol')
            ->color('danger')
            ->requiresConfirmation()
            ->modalHeading("Qurilmani o'chirish")
            ->modalDescription("Token darhol rad etiladi. Qurilma yoqilgunga qadar API chaqiriqlari bloklanadi.")
            ->visible(fn (KioskDevice $record): bool => $record->status === KioskDeviceStatus::Paired->value)
            ->action(function (KioskDevice $record): void {
                $record->update(['status' => KioskDeviceStatus::Disabled->value]);
                Notification::make()
                    ->title("Qurilma o'chirildi")
                    ->success()
                    ->send();
            });
    }

    public static function reEnableAction(): Tables\Actions\Action
    {
        return Tables\Actions\Action::make('reEnable')
            ->label('Qayta yoqish')
            ->icon('heroicon-o-check-circle')
            ->color('success')
            ->requiresConfirmation()
            ->modalHeading('Qurilmani qayta yoqish')
            ->modalDescription("Avvalgi token tiklanadi va qurilma yana ishlay boshlaydi.")
            ->visible(fn (KioskDevice $record): bool => $record->status === KioskDeviceStatus::Disabled->value)
            ->action(function (KioskDevice $record): void {
                $record->update(['status' => KioskDeviceStatus::Paired->value]);
                Notification::make()
                    ->title('Qurilma qayta yoqildi')
                    ->success()
                    ->send();
            });
    }

    public static function forceUnpairAction(): Tables\Actions\Action
    {
        return Tables\Actions\Action::make('forceUnpair')
            ->label("Pairing'ni majburan uzish")
            ->icon('heroicon-o-arrow-uturn-left')
            ->color('danger')
            ->requiresConfirmation()
            ->modalHeading("Qurilmani pairing'dan chiqarish")
            ->modalDescription("Token bekor qilinadi. Qurilma qayta foydalanishi uchun yangi kod kerak boladi.")
            ->modalSubmitActionLabel("Tasdiqlash")
            ->action(function (KioskDevice $record): void {
                $record->update([
                    'status' => KioskDeviceStatus::Unpaired->value,
                    'device_token_hash' => null,
                    'device_token_last4' => null,
                    'paired_at' => null,
                    'last_seen_at' => null,
                ]);
                Notification::make()
                    ->title("Qurilma pairing'dan chiqarildi")
                    ->body('Yangi kod orqali qayta bog\'lashingiz mumkin.')
                    ->warning()
                    ->send();
            });
    }

    /** Permit pairing-code generation only when no usable code is already pending. */
    private static function canGenerateCode(KioskDevice $record): bool
    {
        if ($record->status === KioskDeviceStatus::Disabled->value) {
            return false;
        }
        $pending = KioskPairingCode::query()
            ->where('tenant_id', $record->tenant_id)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->where(function ($q) use ($record): void {
                $q->whereNull('device_id')
                    ->orWhere('device_id', $record->id);
            })
            ->exists();

        return ! $pending;
    }

    /** Cosmetic spacing: "123 456" reads better than "123456". */
    private static function formatCode(string $code): string
    {
        if (strlen($code) === 6) {
            return substr($code, 0, 3) . ' ' . substr($code, 3, 3);
        }
        return $code;
    }
}
