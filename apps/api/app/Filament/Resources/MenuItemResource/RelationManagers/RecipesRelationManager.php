<?php

declare(strict_types=1);

namespace App\Filament\Resources\MenuItemResource\RelationManagers;

use App\Domain\Inventory\Models\Ingredient;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class RecipesRelationManager extends RelationManager
{
    protected static string $relationship = 'recipes';

    protected static ?string $title = 'Retsept (Ingredientlar)';

    protected static ?string $modelLabel = 'Ingredient';

    public function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Select::make('ingredient_id')
                ->label('Ingredient')
                ->options(function () {
                    $tenantId = $this->getOwnerRecord()->tenant_id;
                    return Ingredient::query()
                        ->withoutGlobalScopes(['tenant'])
                        ->where('tenant_id', $tenantId)
                        ->where('is_active', true)
                        ->get()
                        ->mapWithKeys(fn (Ingredient $i) => [
                            $i->id => ($i->name['uz'] ?? '') . ' (' . $i->unit . ')',
                        ])
                        ->all();
                })
                ->searchable()
                ->required()
                ->live()
                ->afterStateUpdated(function ($state, Forms\Set $set): void {
                    if ($state !== null) {
                        $ing = Ingredient::withoutGlobalScopes(['tenant'])->find($state);
                        if ($ing !== null) {
                            $set('unit', $ing->unit);
                        }
                    }
                }),
            Forms\Components\TextInput::make('quantity')
                ->label('Miqdor (1 taomga)')
                ->numeric()
                ->required()
                ->minValue(0),
            Forms\Components\TextInput::make('unit')
                ->label('Birlik')
                ->required()
                ->maxLength(16),
            Forms\Components\Toggle::make('is_optional')
                ->label('Ixtiyoriy'),
        ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('id')
            ->columns([
                Tables\Columns\TextColumn::make('ingredient.name.uz')
                    ->label('Ingredient')
                    ->getStateUsing(fn ($record): string => $record->ingredient?->name['uz'] ?? '')
                    ->weight('semibold'),
                Tables\Columns\TextColumn::make('quantity')
                    ->label('Miqdor')
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 3, '.', ' ')),
                Tables\Columns\TextColumn::make('unit')
                    ->label('Birlik')
                    ->badge(),
                Tables\Columns\IconColumn::make('is_optional')
                    ->label('Ixtiyoriy')
                    ->boolean(),
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make()
                    ->mutateFormDataUsing(function (array $data): array {
                        $data['tenant_id'] = $this->getOwnerRecord()->tenant_id;
                        return $data;
                    }),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\DeleteBulkAction::make(),
            ]);
    }
}
