<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Menu\Models\MenuItem;
use App\Filament\Resources\MenuItemResource\Pages;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class MenuItemResource extends Resource
{
    protected static ?string $model = MenuItem::class;

    protected static ?string $navigationIcon = 'heroicon-o-cake';

    protected static ?string $navigationGroup = 'Menyu';

    protected static ?string $modelLabel = 'Taom';

    protected static ?string $pluralModelLabel = 'Taomlar';

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
                            titleAttribute: 'slug',
                            modifyQueryUsing: function ($query, Forms\Get $get) {
                                $query->withoutGlobalScopes(['tenant']);
                                if ($tenantId = $get('tenant_id')) {
                                    $query->where('tenant_id', $tenantId);
                                }
                                return $query;
                            },
                        )
                        ->searchable()
                        ->preload()
                        ->required(),
                    Forms\Components\Group::make([
                        Forms\Components\TextInput::make('name.uz')
                            ->label('Nomi (UZ)')
                            ->required()
                            ->maxLength(192),
                        Forms\Components\TextInput::make('name.ru')
                            ->label('Nomi (RU)')
                            ->maxLength(192),
                        Forms\Components\TextInput::make('name.en')
                            ->label('Nomi (EN)')
                            ->maxLength(192),
                    ])->columns(3)->columnSpanFull(),
                    Forms\Components\TextInput::make('slug')
                        ->label('Slug')
                        ->required()
                        ->maxLength(192)
                        ->regex('/^[a-z0-9-]+$/'),
                    Forms\Components\TextInput::make('sku')
                        ->label('SKU')
                        ->maxLength(64),
                ])
                ->columns(2),

            Forms\Components\Section::make('Tavsif')
                ->schema([
                    Forms\Components\Group::make([
                        Forms\Components\Textarea::make('description.uz')
                            ->label('Tavsif (UZ)')
                            ->rows(3),
                        Forms\Components\Textarea::make('description.ru')
                            ->label('Tavsif (RU)')
                            ->rows(3),
                        Forms\Components\Textarea::make('description.en')
                            ->label('Tavsif (EN)')
                            ->rows(3),
                    ])->columns(3)->columnSpanFull(),
                ])
                ->collapsed(),

            Forms\Components\Section::make('Narx va xarajat')
                ->schema([
                    Forms\Components\TextInput::make('price_amount')
                        ->label('Narx')
                        ->numeric()
                        ->minValue(0)
                        ->required()
                        ->suffix('so\'m'),
                    Forms\Components\Select::make('price_currency')
                        ->label('Valyuta')
                        ->options([
                            'UZS' => 'UZS',
                            'USD' => 'USD',
                            'EUR' => 'EUR',
                            'RUB' => 'RUB',
                            'KZT' => 'KZT',
                        ])
                        ->required()
                        ->default('UZS'),
                    Forms\Components\TextInput::make('cost_amount')
                        ->label('Tannarx')
                        ->numeric()
                        ->minValue(0),
                ])
                ->columns(3),

            Forms\Components\Section::make('Rasmlar')
                ->schema([
                    Forms\Components\TextInput::make('image_url')
                        ->label('Rasm URL')
                        ->url()
                        ->maxLength(1024),
                    Forms\Components\TextInput::make('thumbnail_url')
                        ->label('Thumbnail URL')
                        ->url()
                        ->maxLength(1024),
                ])
                ->columns(2)
                ->collapsed(),

            Forms\Components\Section::make('Metadata')
                ->schema([
                    Forms\Components\TagsInput::make('allergens')
                        ->label('Allergenlar')
                        ->placeholder('Yangi qo\'shish'),
                    Forms\Components\TagsInput::make('tags')
                        ->label('Teglar')
                        ->placeholder('Yangi qo\'shish'),
                    Forms\Components\TextInput::make('calories')
                        ->label('Kaloriya')
                        ->numeric()
                        ->minValue(0)
                        ->suffix('kcal'),
                    Forms\Components\TextInput::make('preparation_minutes')
                        ->label('Tayyorlash vaqti')
                        ->numeric()
                        ->minValue(0)
                        ->suffix('daq'),
                ])
                ->columns(2)
                ->collapsed(),

            Forms\Components\Section::make('Belgilar')
                ->schema([
                    Forms\Components\Toggle::make('is_active')
                        ->label('Faol')
                        ->default(true),
                    Forms\Components\Toggle::make('is_featured')
                        ->label('Tavsiya etilgan'),
                    Forms\Components\Toggle::make('is_new')
                        ->label('Yangi'),
                    Forms\Components\Toggle::make('has_discount')
                        ->label('Chegirma bor')
                        ->live(),
                    Forms\Components\TextInput::make('discount_percent')
                        ->label('Chegirma %')
                        ->numeric()
                        ->minValue(0)
                        ->maxValue(100)
                        ->suffix('%')
                        ->visible(fn (Forms\Get $get): bool => (bool) $get('has_discount')),
                ])
                ->columns(2),

            Forms\Components\Section::make('Zapas')
                ->schema([
                    Forms\Components\Toggle::make('stock_tracked')
                        ->label('Zapas hisobi')
                        ->live(),
                    Forms\Components\TextInput::make('current_stock')
                        ->label('Hozirgi zapas')
                        ->numeric()
                        ->minValue(0)
                        ->visible(fn (Forms\Get $get): bool => (bool) $get('stock_tracked')),
                    Forms\Components\TextInput::make('low_stock_threshold')
                        ->label('Past zapas chegarasi')
                        ->numeric()
                        ->minValue(0)
                        ->visible(fn (Forms\Get $get): bool => (bool) $get('stock_tracked')),
                ])
                ->columns(3)
                ->collapsed(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\ImageColumn::make('image_url')
                    ->label('Rasm')
                    ->circular()
                    ->size(48),
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
                    ->color('gray')
                    ->searchable(),
                Tables\Columns\TextColumn::make('category.name.uz')
                    ->label('Kategoriya')
                    ->getStateUsing(fn ($record): string => $record->category?->name['uz'] ?? '')
                    ->searchable(query: function ($query, string $search) {
                        return $query->whereHas('category', function ($q) use ($search) {
                            $q->withoutGlobalScopes(['tenant'])
                                ->where('name->uz', 'ilike', "%{$search}%");
                        });
                    })
                    ->color('gray'),
                Tables\Columns\TextColumn::make('price_amount')
                    ->label('Narx')
                    ->formatStateUsing(fn ($state, $record): string => number_format((int) $state, 0, '.', ' ') . ' ' . $record->price_currency)
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Faol')
                    ->boolean(),
                Tables\Columns\IconColumn::make('is_new')
                    ->label('Yangi')
                    ->boolean()
                    ->trueIcon('heroicon-o-sparkles')
                    ->trueColor('info')
                    ->falseIcon('heroicon-o-minus'),
                Tables\Columns\IconColumn::make('is_featured')
                    ->label('Tavsiya')
                    ->boolean()
                    ->trueIcon('heroicon-o-star')
                    ->trueColor('warning')
                    ->falseIcon('heroicon-o-minus'),
                Tables\Columns\IconColumn::make('has_discount')
                    ->label('Chegirma')
                    ->boolean()
                    ->trueIcon('heroicon-o-tag')
                    ->trueColor('success')
                    ->falseIcon('heroicon-o-minus'),
                Tables\Columns\TextColumn::make('current_stock')
                    ->label('Zapas')
                    ->placeholder('—')
                    ->visible(fn (): bool => true)
                    ->sortable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Yaratilgan')
                    ->dateTime('d.m.Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('tenant_id')
                    ->label('Restoran')
                    ->relationship('tenant', 'name')
                    ->searchable()
                    ->preload(),
                Tables\Filters\SelectFilter::make('category_id')
                    ->label('Kategoriya')
                    ->relationship(
                        name: 'category',
                        titleAttribute: 'slug',
                        modifyQueryUsing: fn ($query) => $query->withoutGlobalScopes(['tenant']),
                    )
                    ->searchable()
                    ->preload(),
                Tables\Filters\TernaryFilter::make('is_active')->label('Faol'),
                Tables\Filters\TernaryFilter::make('is_featured')->label('Tavsiya etilgan'),
                Tables\Filters\TernaryFilter::make('is_new')->label('Yangi'),
                Tables\Filters\TernaryFilter::make('has_discount')->label('Chegirma'),
                Tables\Filters\TrashedFilter::make(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
                Tables\Actions\RestoreAction::make(),
                Tables\Actions\ForceDeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\ForceDeleteBulkAction::make(),
                    Tables\Actions\RestoreBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListMenuItems::route('/'),
            'create' => Pages\CreateMenuItem::route('/create'),
            'edit' => Pages\EditMenuItem::route('/{record}/edit'),
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
