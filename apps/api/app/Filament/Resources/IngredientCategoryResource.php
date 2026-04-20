<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Inventory\Models\IngredientCategory;
use App\Filament\Resources\IngredientCategoryResource\Pages;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class IngredientCategoryResource extends Resource
{
    protected static ?string $model = IngredientCategory::class;

    protected static ?string $navigationIcon = 'heroicon-o-squares-2x2';

    protected static ?string $navigationGroup = 'Zapas';

    protected static ?string $modelLabel = 'Ingredient kategoriyasi';

    protected static ?string $pluralModelLabel = 'Ingredient kategoriyalari';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Asosiy')
                ->schema([
                    Forms\Components\Select::make('tenant_id')
                        ->label('Restoran')
                        ->relationship('tenant', 'name')
                        ->searchable()
                        ->preload()
                        ->required(),
                    Forms\Components\Group::make([
                        Forms\Components\TextInput::make('name.uz')
                            ->label('Nomi (UZ)')
                            ->required()
                            ->maxLength(128),
                        Forms\Components\TextInput::make('name.ru')
                            ->label('Nomi (RU)')
                            ->maxLength(128),
                        Forms\Components\TextInput::make('name.en')
                            ->label('Nomi (EN)')
                            ->maxLength(128),
                    ])->columns(3)->columnSpanFull(),
                    Forms\Components\TextInput::make('sort_order')
                        ->label('Tartib')
                        ->numeric()
                        ->default(0),
                ])
                ->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('sort_order')
            ->columns([
                Tables\Columns\TextColumn::make('name.uz')
                    ->label('Nomi')
                    ->getStateUsing(fn ($record): string => $record->name['uz'] ?? '')
                    ->searchable(query: function ($query, string $search) {
                        return $query->where('name->uz', 'ilike', "%{$search}%");
                    })
                    ->weight('semibold'),
                Tables\Columns\TextColumn::make('tenant.name')
                    ->label('Restoran')
                    ->badge()
                    ->color('gray'),
                Tables\Columns\TextColumn::make('sort_order')
                    ->label('Tartib')
                    ->sortable(),
                Tables\Columns\TextColumn::make('ingredients_count')
                    ->label('Ingredientlar')
                    ->counts('ingredients')
                    ->badge(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('tenant_id')
                    ->label('Restoran')
                    ->relationship('tenant', 'name')
                    ->searchable()
                    ->preload(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListIngredientCategories::route('/'),
            'create' => Pages\CreateIngredientCategory::route('/create'),
            'edit' => Pages\EditIngredientCategory::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        return parent::getEloquentQuery()->withoutGlobalScopes(['tenant']);
    }
}
