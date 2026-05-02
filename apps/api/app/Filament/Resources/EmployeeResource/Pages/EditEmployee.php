<?php

declare(strict_types=1);

namespace App\Filament\Resources\EmployeeResource\Pages;

use App\Domain\Employee\Models\Employee;
use App\Filament\Resources\EmployeeResource;
use Filament\Actions;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Hash;

class EditEmployee extends EditRecord
{
    protected static string $resource = EmployeeResource::class;

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function mutateFormDataBeforeFill(array $data): array
    {
        /** @var Employee $record */
        $record = $this->record;
        $user = $record->user;
        $data['user_data'] = [
            'name' => $user?->name,
            'email' => $user?->email,
            'phone' => $user?->phone,
            'locale' => $user?->locale ?? 'uz',
        ];
        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function mutateFormDataBeforeSave(array $data): array
    {
        $userData = $data['user_data'] ?? [];
        unset($data['user_data']);

        /** @var Employee $record */
        $record = $this->record;
        if ($record->user !== null && is_array($userData)) {
            $record->user->update(array_filter([
                'name' => $userData['name'] ?? null,
                'phone' => $userData['phone'] ?? null,
                'email' => $userData['email'] ?? null,
                'locale' => $userData['locale'] ?? null,
            ], fn ($v) => $v !== null && $v !== ''));
        }

        return $data;
    }

    protected function getHeaderActions(): array
    {
        return [
            $this->resetPinHeaderAction(),
            Actions\DeleteAction::make(),
            Actions\RestoreAction::make(),
        ];
    }

    private function resetPinHeaderAction(): Actions\Action
    {
        return Actions\Action::make('resetPin')
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
            ->action(function (array $data): void {
                /** @var Employee $record */
                $record = $this->record;
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
}
