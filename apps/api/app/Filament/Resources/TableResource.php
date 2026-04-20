<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Table\Enums\TableShape;
use App\Domain\Table\Enums\TableStatus;
use App\Domain\Table\Models\Table as TableModel;
use App\Filament\Resources\TableResource\Pages;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class TableResource extends Resource
{
    protected static ?string $model = TableModel::class;

    protected static ?string $navigationIcon = 'heroicon-o-table-cells';

    protected static ?string $navigationGroup = 'Stollar';

    protected static ?string $modelLabel = 'Stol';

    protected static ?string $pluralModelLabel = 'Stollar';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Asosiy')
                ->schema([
                    Forms\Components\TextInput::make('name')
                        ->label('Nomi')
                        ->required()
                        ->maxLength(64),
                    Forms\Components\TextInput::make('capacity')
                        ->label('Sig\'imi')
                        ->required()
                        ->numeric()
                        ->minValue(1)
                        ->maxValue(50)
                        ->default(4),
                    Forms\Components\Select::make('category_id')
                        ->label('Zona')
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
                        ->placeholder('—'),
                    Forms\Components\Select::make('shape')
                        ->label('Shakli')
                        ->options(collect(TableShape::cases())
                            ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                            ->toArray())
                        ->required()
                        ->default(TableShape::Round->value),
                ])
                ->columns(2),

            Forms\Components\Section::make('Joylashuv')
                ->schema([
                    Forms\Components\TextInput::make('position_x')
                        ->label('X')
                        ->numeric()
                        ->minValue(0),
                    Forms\Components\TextInput::make('position_y')
                        ->label('Y')
                        ->numeric()
                        ->minValue(0),
                    Forms\Components\TextInput::make('width')
                        ->label('Kengligi')
                        ->numeric()
                        ->minValue(0),
                    Forms\Components\TextInput::make('height')
                        ->label('Balandligi')
                        ->numeric()
                        ->minValue(0),
                ])
                ->columns(4)
                ->collapsed(),

            Forms\Components\Section::make('Holati')
                ->schema([
                    Forms\Components\Select::make('status')
                        ->label('Holati')
                        ->options(collect(TableStatus::cases())
                            ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                            ->toArray())
                        ->required()
                        ->default(TableStatus::Available->value),
                    Forms\Components\TextInput::make('qr_code')
                        ->label('QR kod')
                        ->maxLength(128),
                ])
                ->columns(2),

            Forms\Components\Section::make('Tenant')
                ->schema([
                    Forms\Components\Select::make('tenant_id')
                        ->label('Restoran')
                        ->relationship('tenant', 'name')
                        ->searchable()
                        ->preload()
                        ->required()
                        ->live(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('name')
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Nomi')
                    ->searchable()
                    ->sortable()
                    ->weight('semibold'),
                Tables\Columns\TextColumn::make('tenant.name')
                    ->label('Restoran')
                    ->badge()
                    ->color('gray')
                    ->searchable(),
                Tables\Columns\TextColumn::make('category.name.uz')
                    ->label('Zona')
                    ->getStateUsing(fn ($record): string => $record->category?->name['uz'] ?? '')
                    ->badge()
                    ->color('gray'),
                Tables\Columns\TextColumn::make('capacity')
                    ->label('Sig\'imi')
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->label('Holati')
                    ->badge()
                    ->color(fn (string $state): string => TableStatus::tryFrom($state)?->color() ?? 'gray')
                    ->formatStateUsing(fn (string $state): string => TableStatus::tryFrom($state)?->label() ?? $state),
                Tables\Columns\TextColumn::make('shape')
                    ->label('Shakli')
                    ->formatStateUsing(fn (string $state): string => TableShape::tryFrom($state)?->label() ?? $state)
                    ->color('gray'),
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
                    ->label('Zona')
                    ->relationship(
                        name: 'category',
                        titleAttribute: 'slug',
                        modifyQueryUsing: fn ($query) => $query->withoutGlobalScopes(['tenant']),
                    )
                    ->searchable()
                    ->preload(),
                Tables\Filters\SelectFilter::make('status')
                    ->label('Holati')
                    ->options(collect(TableStatus::cases())
                        ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                        ->toArray()),
                Tables\Filters\SelectFilter::make('shape')
                    ->label('Shakli')
                    ->options(collect(TableShape::cases())
                        ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                        ->toArray()),
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
            'index' => Pages\ListTables::route('/'),
            'create' => Pages\CreateTable::route('/create'),
            'edit' => Pages\EditTable::route('/{record}/edit'),
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
