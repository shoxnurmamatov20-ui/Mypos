<?php

declare(strict_types=1);

namespace App\Filament\Resources\OrderResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class ItemsRelationManager extends RelationManager
{
    protected static string $relationship = 'items';

    protected static ?string $title = 'Mahsulotlar';

    public function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name_snapshot')
                ->label('Nomi')
                ->disabled(),
            Forms\Components\TextInput::make('quantity')
                ->label('Soni')
                ->numeric()
                ->disabled(),
            Forms\Components\TextInput::make('price_amount')
                ->label('Narxi')
                ->numeric()
                ->disabled(),
            Forms\Components\TextInput::make('subtotal_amount')
                ->label('Jami')
                ->numeric()
                ->disabled(),
            Forms\Components\TextInput::make('status')
                ->label('Holati')
                ->disabled(),
        ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('name_snapshot')
            ->columns([
                Tables\Columns\TextColumn::make('name_snapshot')
                    ->label('Nomi')
                    ->weight('semibold'),
                Tables\Columns\TextColumn::make('quantity')
                    ->label('Soni')
                    ->sortable(),
                Tables\Columns\TextColumn::make('price_amount')
                    ->label('Narxi')
                    ->formatStateUsing(fn ($state, $record): string => number_format((int) $state, 0, '.', ' ') . ' ' . $record->currency)
                    ->sortable(),
                Tables\Columns\TextColumn::make('subtotal_amount')
                    ->label('Jami')
                    ->formatStateUsing(fn ($state, $record): string => number_format((int) $state, 0, '.', ' ') . ' ' . $record->currency)
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->label('Holati')
                    ->badge()
                    ->color('gray'),
            ])
            ->headerActions([])
            ->actions([
                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([]);
    }

    public function isReadOnly(): bool
    {
        return true;
    }
}
