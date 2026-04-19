<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Auth\Enums\Role;
use App\Filament\Resources\UserResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Hash;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationGroup = 'Platform';

    protected static ?string $modelLabel = 'Foydalanuvchi';

    protected static ?string $pluralModelLabel = 'Foydalanuvchilar';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Shaxsiy ma\'lumotlar')
                ->schema([
                    Forms\Components\TextInput::make('name')
                        ->label('Ism')
                        ->required()
                        ->maxLength(128),
                    Forms\Components\TextInput::make('email')
                        ->label('Email')
                        ->email()
                        ->required()
                        ->unique(ignoreRecord: true)
                        ->maxLength(128),
                    Forms\Components\TextInput::make('phone')
                        ->label('Telefon')
                        ->tel()
                        ->unique(ignoreRecord: true)
                        ->maxLength(32),
                    Forms\Components\Select::make('locale')
                        ->label('Til')
                        ->options([
                            'uz' => "O'zbekcha",
                            'ru' => 'Русский',
                            'en' => 'English',
                        ])
                        ->default('uz'),
                ])
                ->columns(2),

            Forms\Components\Section::make('Xavfsizlik va kirish')
                ->schema([
                    Forms\Components\TextInput::make('password')
                        ->label('Parol')
                        ->password()
                        ->revealable()
                        ->dehydrateStateUsing(fn ($state) => Hash::make($state))
                        ->dehydrated(fn ($state) => filled($state))
                        ->required(fn (string $operation): bool => $operation === 'create')
                        ->helperText('Tahrirlash paytida bo\'sh qoldirsangiz, parol o\'zgarmaydi'),
                    Forms\Components\Toggle::make('is_super_admin')
                        ->label('Super Admin')
                        ->helperText('MyPOS platformasining to\'liq boshqaruvi'),
                    Forms\Components\Select::make('tenant_id')
                        ->label('Restoran')
                        ->relationship('tenant', 'name')
                        ->searchable()
                        ->preload()
                        ->helperText('Super adminlar uchun bo\'sh qoldiring'),
                    Forms\Components\Select::make('roles')
                        ->label('Rollari')
                        ->relationship('roles', 'name')
                        ->multiple()
                        ->preload()
                        ->searchable()
                        ->options(collect(Role::cases())
                            ->mapWithKeys(fn ($r) => [$r->value => $r->label()])
                            ->toArray()),
                ])
                ->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Ism')
                    ->searchable()
                    ->weight('semibold'),
                Tables\Columns\TextColumn::make('email')
                    ->label('Email')
                    ->searchable()
                    ->copyable(),
                Tables\Columns\TextColumn::make('phone')
                    ->label('Telefon')
                    ->searchable(),
                Tables\Columns\TextColumn::make('tenant.name')
                    ->label('Restoran')
                    ->searchable()
                    ->placeholder('—'),
                Tables\Columns\TextColumn::make('roles.name')
                    ->label('Rollari')
                    ->badge()
                    ->separator(',')
                    ->color('primary'),
                Tables\Columns\IconColumn::make('is_super_admin')
                    ->label('SA')
                    ->boolean(),
                Tables\Columns\TextColumn::make('last_login_at')
                    ->label('Oxirgi kirish')
                    ->dateTime('d.m.Y H:i')
                    ->placeholder('—')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Yaratilgan')
                    ->dateTime('d.m.Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_super_admin')
                    ->label('Super Admin'),
                Tables\Filters\SelectFilter::make('tenant_id')
                    ->label('Restoran')
                    ->relationship('tenant', 'name')
                    ->searchable()
                    ->preload(),
                Tables\Filters\TrashedFilter::make(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
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
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        return parent::getEloquentQuery()
            ->withoutGlobalScopes([
                \Illuminate\Database\Eloquent\SoftDeletingScope::class,
            ]);
    }
}
