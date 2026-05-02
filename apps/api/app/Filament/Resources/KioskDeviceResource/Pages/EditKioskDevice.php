<?php

declare(strict_types=1);

namespace App\Filament\Resources\KioskDeviceResource\Pages;

use App\Domain\Kiosk\Actions\GeneratePairingCodeAction;
use App\Domain\Kiosk\Enums\KioskDeviceStatus;
use App\Domain\Kiosk\Models\KioskDevice;
use App\Domain\Kiosk\Models\KioskPairingCode;
use App\Filament\Resources\KioskDeviceResource;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Auth;

class EditKioskDevice extends EditRecord
{
    protected static string $resource = KioskDeviceResource::class;

    /** @return array<int, Actions\Action> */
    protected function getHeaderActions(): array
    {
        return [
            $this->generatePairingCodeAction(),
            $this->disableAction(),
            $this->reEnableAction(),
            $this->forceUnpairAction(),
            Actions\DeleteAction::make(),
            Actions\RestoreAction::make(),
        ];
    }

    private function generatePairingCodeAction(): Actions\Action
    {
        return Actions\Action::make('generatePairingCode')
            ->label('Kod yaratish')
            ->icon('heroicon-o-key')
            ->color('primary')
            ->visible(fn (): bool => $this->canGenerateCode())
            ->modalHeading('Pairing kod yaratish')
            ->modalDescription("Yangi 6 raqamli kod yaratiladi va 15 daqiqa amal qiladi.")
            ->modalSubmitActionLabel('Yaratish')
            ->action(function (): void {
                /** @var KioskDevice $record */
                $record = $this->record;
                $tenant = $record->tenant;
                if ($tenant === null) {
                    Notification::make()->title('Tenant topilmadi')->danger()->send();
                    return;
                }
                $code = app(GeneratePairingCodeAction::class)($tenant, Auth::user());
                Notification::make()
                    ->title('Kod yaratildi: ' . self::formatCode($code->code))
                    ->body(
                        "Amal qilish vaqti: "
                        . $code->expires_at->translatedFormat('H:i')
                    )
                    ->success()
                    ->persistent()
                    ->send();
            });
    }

    private function disableAction(): Actions\Action
    {
        return Actions\Action::make('disable')
            ->label("O'chirish")
            ->icon('heroicon-o-no-symbol')
            ->color('danger')
            ->requiresConfirmation()
            ->modalHeading("Qurilmani o'chirish")
            ->modalDescription("Token darhol rad etiladi.")
            ->visible(fn (): bool => $this->record instanceof KioskDevice
                && $this->record->status === KioskDeviceStatus::Paired->value)
            ->action(function (): void {
                /** @var KioskDevice $record */
                $record = $this->record;
                $record->update(['status' => KioskDeviceStatus::Disabled->value]);
                Notification::make()->title("Qurilma o'chirildi")->success()->send();
            });
    }

    private function reEnableAction(): Actions\Action
    {
        return Actions\Action::make('reEnable')
            ->label('Qayta yoqish')
            ->icon('heroicon-o-check-circle')
            ->color('success')
            ->requiresConfirmation()
            ->modalHeading('Qurilmani qayta yoqish')
            ->visible(fn (): bool => $this->record instanceof KioskDevice
                && $this->record->status === KioskDeviceStatus::Disabled->value)
            ->action(function (): void {
                /** @var KioskDevice $record */
                $record = $this->record;
                $record->update(['status' => KioskDeviceStatus::Paired->value]);
                Notification::make()->title('Qurilma qayta yoqildi')->success()->send();
            });
    }

    private function forceUnpairAction(): Actions\Action
    {
        return Actions\Action::make('forceUnpair')
            ->label("Pairing'ni majburan uzish")
            ->icon('heroicon-o-arrow-uturn-left')
            ->color('danger')
            ->requiresConfirmation()
            ->modalHeading("Qurilmani pairing'dan chiqarish")
            ->modalDescription("Token bekor qilinadi. Qayta foydalanish uchun yangi kod kerak boladi.")
            ->action(function (): void {
                /** @var KioskDevice $record */
                $record = $this->record;
                $record->update([
                    'status' => KioskDeviceStatus::Unpaired->value,
                    'device_token_hash' => null,
                    'device_token_last4' => null,
                    'paired_at' => null,
                    'last_seen_at' => null,
                ]);
                Notification::make()
                    ->title("Qurilma pairing'dan chiqarildi")
                    ->warning()
                    ->send();
            });
    }

    private function canGenerateCode(): bool
    {
        if (! $this->record instanceof KioskDevice) {
            return false;
        }
        /** @var KioskDevice $record */
        $record = $this->record;
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

    private static function formatCode(string $code): string
    {
        if (strlen($code) === 6) {
            return substr($code, 0, 3) . ' ' . substr($code, 3, 3);
        }
        return $code;
    }
}
