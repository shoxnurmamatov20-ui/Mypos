<?php

declare(strict_types=1);

namespace App\Filament\Resources\EmployeeResource\Schemas;

use App\Domain\Employee\Enums\EmployeeStatus;
use App\Domain\Employee\Models\Employee;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Tables;
use Illuminate\Support\Facades\Hash;

/**
 * Row & bulk action factories for the EmployeeResource.
 */
final class EmployeeActions
{
    public static function resetPinAction(): Tables\Actions\Action
    {
        return Tables\Actions\Action::make('resetPin')
            ->label('PIN-ni almashtirish')
            ->icon('heroicon-o-key')
            ->color('warning')
            ->modalHeading("PIN-kod o'rnatish")
            ->modalSubmitActionLabel('Saqlash')
            ->form([
                Forms\Components\TextInput::make('pin')
                    ->label('Yangi PIN (4-6 raqam)')
                    ->password()
                    ->revealable()
                    ->required()
                    ->numeric()
                    ->minLength(4)
                    ->maxLength(6)
                    ->rules(['regex:/^[0-9]{4,6}$/'])
                    ->helperText('Xodimga maxfiy ravishda yetkazib bering'),
                Forms\Components\TextInput::make('pin_confirmation')
                    ->label('PIN-ni takrorlang')
                    ->password()
                    ->revealable()
                    ->required()
                    ->same('pin'),
            ])
            ->action(function (Employee $record, array $data): void {
                $record->forceFill([
                    'pin_code_hash' => Hash::make((string) $data['pin']),
                    'pin_set_at' => now(),
                ])->save();
                Notification::make()
                    ->title("PIN muvaffaqiyatli o'rnatildi")
                    ->success()
                    ->send();
            });
    }

    public static function terminateAction(): Tables\Actions\Action
    {
        return Tables\Actions\Action::make('terminate')
            ->label("Ishdan bo'shatish")
            ->icon('heroicon-o-x-circle')
            ->color('danger')
            ->requiresConfirmation()
            ->visible(fn (Employee $record): bool => $record->status !== EmployeeStatus::Terminated->value)
            ->action(function (Employee $record): void {
                $record->update([
                    'status' => EmployeeStatus::Terminated->value,
                    'terminated_at' => now(),
                ]);
                Notification::make()
                    ->title("Xodim ishdan bo'shatildi")
                    ->success()
                    ->send();
            });
    }

    /** @return array<int, Tables\Actions\Action> */
    public static function rowActions(): array
    {
        return [
            Tables\Actions\ActionGroup::make([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                self::resetPinAction(),
                self::terminateAction(),
                Tables\Actions\DeleteAction::make(),
                Tables\Actions\RestoreAction::make(),
            ]),
        ];
    }

    /** @return array<int, Tables\Actions\BulkAction> */
    public static function bulkActions(): array
    {
        return [
            Tables\Actions\BulkActionGroup::make([
                Tables\Actions\BulkAction::make('deactivate')
                    ->label('Nofaol qilish')
                    ->icon('heroicon-o-pause-circle')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->action(function ($records): void {
                        foreach ($records as $employee) {
                            /** @var Employee $employee */
                            $employee->update([
                                'status' => EmployeeStatus::OnLeave->value,
                            ]);
                        }
                    }),
                Tables\Actions\BulkAction::make('terminate')
                    ->label("Ishdan bo'shatish")
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->action(function ($records): void {
                        foreach ($records as $employee) {
                            /** @var Employee $employee */
                            $employee->update([
                                'status' => EmployeeStatus::Terminated->value,
                                'terminated_at' => now(),
                            ]);
                        }
                    }),
                Tables\Actions\DeleteBulkAction::make(),
                Tables\Actions\ForceDeleteBulkAction::make(),
                Tables\Actions\RestoreBulkAction::make(),
            ]),
        ];
    }
}
