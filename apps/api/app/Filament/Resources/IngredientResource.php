<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Inventory\Actions\AdjustStockAction;
use App\Domain\Inventory\Enums\StockMovementReason;
use App\Domain\Inventory\Models\Ingredient;
use App\Filament\Resources\IngredientResource\Pages;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Table;

class IngredientResource extends Resource
{
    protected static ?string $model = Ingredient::class;

    protected static ?string $navigationIcon = 'heroicon-o-beaker';

    protected static ?string $navigationGroup = 'Zapas';

    protected static ?string $modelLabel = 'Ingredient';

    protected static ?string $pluralModelLabel = 'Ingredientlar';

    protected static ?int $navigationSort = 2;

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
                        ->required()
                        ->live(),
                    Forms\Components\Select::make('category_id')
                        ->label('Kategoriya')
                        ->relationship(
                            name: 'category',
                            titleAttribute: 'id',
                            modifyQueryUsing: function ($query, Forms\Get $get) {
                                $query->withoutGlobalScopes(['tenant']);
                                if ($tenantId = $get('tenant_id')) {
                                    $query->where('tenant_id', $tenantId);
                                }
                                return $query;
                            },
                        )
                        ->getOptionLabelFromRecordUsing(fn ($record): string => $record->name['uz'] ?? '')
                        ->searchable()
                        ->preload(),
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
                    Forms\Components\TextInput::make('sku')
                        ->label('SKU')
                        ->maxLength(64),
                    Forms\Components\TextInput::make('unit')
                        ->label('O\'lchov birligi')
                        ->required()
                        ->maxLength(16)
                        ->placeholder('kg, L, piece'),
                ])
                ->columns(2),

            Forms\Components\Section::make('Narx va zapas')
                ->schema([
                    Forms\Components\TextInput::make('cost_per_unit')
                        ->label('Birlik tannarx')
                        ->numeric()
                        ->minValue(0)
                        ->required()
                        ->suffix('so\'m'),
                    Forms\Components\TextInput::make('current_stock')
                        ->label('Hozirgi qoldiq')
                        ->numeric()
                        ->default(0)
                        ->minValue(0),
                    Forms\Components\TextInput::make('min_stock')
                        ->label('Min qoldiq')
                        ->numeric()
                        ->minValue(0),
                    Forms\Components\TextInput::make('reorder_point')
                        ->label('Qayta buyurtma nuqtasi')
                        ->numeric()
                        ->minValue(0),
                    Forms\Components\Toggle::make('is_active')
                        ->label('Faol')
                        ->default(true),
                ])
                ->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('name->uz')
            ->columns([
                Tables\Columns\TextColumn::make('name.uz')
                    ->label('Nomi')
                    ->getStateUsing(fn ($record): string => $record->name['uz'] ?? '')
                    ->searchable(query: function ($query, string $search) {
                        return $query->where('name->uz', 'ilike', "%{$search}%");
                    })
                    ->weight('semibold'),
                Tables\Columns\TextColumn::make('sku')
                    ->label('SKU')
                    ->searchable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('category.name.uz')
                    ->label('Kategoriya')
                    ->getStateUsing(fn ($record): string => $record->category?->name['uz'] ?? '')
                    ->color('gray'),
                Tables\Columns\TextColumn::make('unit')
                    ->label('Birlik')
                    ->badge()
                    ->color('gray'),
                Tables\Columns\TextColumn::make('current_stock')
                    ->label('Qoldiq')
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2, '.', ' '))
                    ->color(fn ($record): string => $record->isLowStock() ? 'danger' : 'success')
                    ->sortable(),
                Tables\Columns\TextColumn::make('min_stock')
                    ->label('Min')
                    ->formatStateUsing(fn ($state): string => $state !== null ? number_format((float) $state, 2, '.', ' ') : '—')
                    ->sortable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('cost_per_unit')
                    ->label('Tannarx')
                    ->formatStateUsing(fn ($state): string => number_format((int) $state, 0, '.', ' ') . ' so\'m')
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Faol')
                    ->boolean(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('tenant_id')
                    ->label('Restoran')
                    ->relationship('tenant', 'name')
                    ->searchable()
                    ->preload(),
                Tables\Filters\TernaryFilter::make('is_active')->label('Faol'),
                Filter::make('low_stock')
                    ->label('Faqat kam qoldiq')
                    ->query(fn ($query) => $query->lowStock())
                    ->toggle(),
                Tables\Filters\TrashedFilter::make(),
            ])
            ->actions([
                Tables\Actions\Action::make('adjustStock')
                    ->label('Tuzatish')
                    ->icon('heroicon-o-adjustments-horizontal')
                    ->color('warning')
                    ->form([
                        Forms\Components\TextInput::make('delta')
                            ->label('O\'zgarish (+/-)')
                            ->numeric()
                            ->required()
                            ->helperText('Musbat — qabul qilish, manfiy — chiqim'),
                        Forms\Components\Select::make('reason')
                            ->label('Sabab')
                            ->options(collect(StockMovementReason::cases())
                                ->mapWithKeys(fn ($c) => [$c->value => $c->label()])
                                ->all())
                            ->required()
                            ->default(StockMovementReason::Adjustment->value),
                        Forms\Components\Textarea::make('notes')->label('Izoh')->rows(2),
                    ])
                    ->action(function (array $data, Ingredient $record): void {
                        app(AdjustStockAction::class)([
                            'ingredient_id' => $record->id,
                            'delta' => $data['delta'],
                            'reason' => $data['reason'],
                            'notes' => $data['notes'] ?? null,
                        ]);
                        Notification::make()->title('Qoldiq yangilandi')->success()->send();
                    }),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
                Tables\Actions\RestoreAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\RestoreBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListIngredients::route('/'),
            'create' => Pages\CreateIngredient::route('/create'),
            'edit' => Pages\EditIngredient::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        return parent::getEloquentQuery()
            ->withoutGlobalScopes([
                \Illuminate\Database\Eloquent\SoftDeletingScope::class,
                'tenant',
            ]);
    }
}
