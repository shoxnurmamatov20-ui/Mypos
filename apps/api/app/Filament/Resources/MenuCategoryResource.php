<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Menu\Models\MenuCategory;
use App\Filament\Resources\MenuCategoryResource\Pages;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class MenuCategoryResource extends Resource
{
    protected static ?string $model = MenuCategory::class;

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-group';

    protected static ?string $navigationGroup = 'Menyu';

    protected static ?string $modelLabel = 'Menyu kategoriyasi';

    protected static ?string $pluralModelLabel = 'Menyu kategoriyalari';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Asosiy ma\'lumotlar')
                ->schema([
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
                    Forms\Components\TextInput::make('slug')
                        ->label('Slug')
                        ->required()
                        ->maxLength(128)
                        ->regex('/^[a-z0-9-]+$/')
                        ->helperText('URL uchun: faqat kichik harflar, raqamlar va tire'),
                    Forms\Components\TextInput::make('icon')
                        ->label('Ikon')
                        ->maxLength(64)
                        ->helperText('Heroicon nomi (masalan: cake)'),
                    Forms\Components\ColorPicker::make('color')
                        ->label('Rang'),
                    Forms\Components\TextInput::make('sort_order')
                        ->label('Tartib raqami')
                        ->required()
                        ->numeric()
                        ->default(0),
                    Forms\Components\Toggle::make('is_active')
                        ->label('Faol')
                        ->default(true)
                        ->required(),
                ])
                ->columns(2),

            Forms\Components\Section::make('Bog\'lanishlar')
                ->schema([
                    Forms\Components\Select::make('tenant_id')
                        ->label('Restoran')
                        ->relationship('tenant', 'name')
                        ->searchable()
                        ->preload()
                        ->required(),
                    Forms\Components\Select::make('parent_id')
                        ->label('Asosiy kategoriya')
                        ->relationship(
                            name: 'parent',
                            titleAttribute: 'slug',
                            modifyQueryUsing: fn ($query) => $query->withoutGlobalScopes(['tenant']),
                        )
                        ->searchable()
                        ->preload()
                        ->placeholder('—'),
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
                        return $query->where('name->uz', 'like', "%{$search}%");
                    })
                    ->weight('semibold'),
                Tables\Columns\TextColumn::make('tenant.name')
                    ->label('Restoran')
                    ->badge()
                    ->color('gray')
                    ->searchable(),
                Tables\Columns\TextColumn::make('slug')
                    ->label('Slug')
                    ->copyable()
                    ->color('gray')
                    ->size('sm'),
                Tables\Columns\TextColumn::make('icon')
                    ->label('Ikon')
                    ->color('gray'),
                Tables\Columns\ColorColumn::make('color')
                    ->label('Rang'),
                Tables\Columns\TextColumn::make('sort_order')
                    ->label('Tartib')
                    ->sortable(),
                Tables\Columns\TextColumn::make('items_count')
                    ->counts('items')
                    ->label('Taomlar')
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Faol')
                    ->boolean(),
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
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Faol'),
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
            'index' => Pages\ListMenuCategories::route('/'),
            'create' => Pages\CreateMenuCategory::route('/create'),
            'edit' => Pages\EditMenuCategory::route('/{record}/edit'),
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
