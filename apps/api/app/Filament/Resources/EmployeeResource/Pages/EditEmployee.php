<?php

declare(strict_types=1);

namespace App\Filament\Resources\EmployeeResource\Pages;

use App\Domain\Employee\Models\Employee;
use App\Filament\Resources\EmployeeResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

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
            ], fn ($v) => $v !== null));
        }

        return $data;
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
