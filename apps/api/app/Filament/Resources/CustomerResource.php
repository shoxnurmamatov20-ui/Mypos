<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Customer\Enums\LoyaltyTier;
use App\Domain\Customer\Models\Customer;
use App\Filament\Resources\CustomerResource\Pages;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class CustomerResource extends Resource
{
    protected static ?string $model = Customer::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationGroup = 'Mijozlar';

    protected static ?string $modelLabel = 'Mijoz';

    protected static ?string $pluralModelLabel = 'Mijozlar';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Asosiy ma\'lumotlar')
                ->schema([
                    Forms\Components\Select::make('tenant_id')
                        ->label('Restoran')
                        ->relationship('tenant', 'name')
                        ->searchable()
                        ->preload()
                        ->required(),
                    Forms\Components\TextInput::make('first_name')
                        ->label('Ism')
                        ->required()
                        ->maxLength(64),
                    Forms\Components\TextInput::make('last_name')
                        ->label('Familiya')
                        ->maxLength(64),
                    Forms\Components\TextInput::make('phone')
                        ->label('Telefon')
                        ->tel()
                        ->required()
                        ->maxLength(32)
                        ->placeholder('+998901234567'),
                    Forms\Components\TextInput::make('email')
                        ->label('Email')
                        ->email()
                        ->maxLength(128),
                    Forms\Components\DatePicker::make('birthday')
                        ->label('Tug\'ilgan sana')
                        ->native(false)
                        ->displayFormat('d.m.Y'),
                    Forms\Components\Select::make('locale')
                        ->label('Til')
                        ->options([
                            'uz' => 'O\'zbek',
                            'ru' => 'Русский',
                            'en' => 'English',
                        ])
                        ->default('uz')
                        ->required(),
                    Forms\Components\Select::make('gender')
                        ->label('Jins')
                        ->options([
                            'male' => 'Erkak',
                            'female' => 'Ayol',
                            'other' => 'Boshqa',
                        ])
                        ->placeholder('—'),
                    Forms\Components\TextInput::make('avatar_url')
                        ->label('Avatar URL')
                        ->url()
                        ->maxLength(512),
                ])
                ->columns(2),

            Forms\Components\Section::make('Teglar va eslatmalar')
                ->schema([
                    Forms\Components\TagsInput::make('tags')
                        ->label('Teglar')
                        ->placeholder('VIP, doimiy, ...'),
                    Forms\Components\Textarea::make('notes')
                        ->label('Eslatma')
                        ->rows(3)
                        ->maxLength(2000),
                ])
                ->collapsed(),

            Forms\Components\Section::make('Sodiqlik')
                ->schema([
                    Forms\Components\Placeholder::make('loyalty_tier')
                        ->label('Daraja')
                        ->content(fn (?Customer $record): string => $record?->loyaltyAccount
                            ? (LoyaltyTier::tryFrom($record->loyaltyAccount->tier)?->label() ?? $record->loyaltyAccount->tier)
                            : '—'),
                    Forms\Components\Placeholder::make('points_balance')
                        ->label('Hozirgi ball')
                        ->content(fn (?Customer $record): string => (string) ($record?->loyaltyAccount?->points_balance ?? '—')),
                    Forms\Components\Placeholder::make('lifetime_points')
                        ->label('Umumiy ball')
                        ->content(fn (?Customer $record): string => (string) ($record?->loyaltyAccount?->lifetime_points ?? '—')),
                ])
                ->columns(3)
                ->collapsed(),

            Forms\Components\Section::make('Statistika')
                ->schema([
                    Forms\Components\Placeholder::make('total_orders')
                        ->label('Buyurtmalar soni')
                        ->content(fn (?Customer $record): string => (string) ($record?->total_orders ?? 0)),
                    Forms\Components\Placeholder::make('total_spent')
                        ->label('Umumiy xarid')
                        ->content(fn (?Customer $record): string => self::fmtSum($record?->total_spent ?? 0)),
                    Forms\Components\Placeholder::make('last_visit_at')
                        ->label('Oxirgi tashrif')
                        ->content(fn (?Customer $record): string => $record?->last_visit_at?->format('d.m.Y H:i') ?? '—'),
                ])
                ->columns(3)
                ->collapsed(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('last_visit_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('full_name')
                    ->label('Ism')
                    ->getStateUsing(fn (Customer $record): string => $record->fullName())
                    ->searchable(query: function ($query, string $search) {
                        return $query
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    })
                    ->weight('semibold'),
                Tables\Columns\TextColumn::make('phone')
                    ->label('Telefon')
                    ->copyable()
                    // phone is encrypted at rest (CLAUDE.md §7); search via
                    // HMAC `phone_index` for exact-match lookup.
                    ->searchable(query: function ($query, string $search) {
                        $digits = (string) preg_replace('/\D/', '', $search);
                        if (strlen($digits) < 9) {
                            return $query->whereRaw('1 = 0');
                        }
                        return $query->where('phone_index', Customer::hashPhone($search));
                    }),
                Tables\Columns\TextColumn::make('email')
                    ->label('Email')
                    ->placeholder('—')
                    ->color('gray')
                    // email is encrypted at rest; ilike search disabled.
                    ->toggleable(),
                Tables\Columns\TextColumn::make('tenant.name')
                    ->label('Restoran')
                    ->badge()
                    ->color('gray')
                    ->searchable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('loyaltyAccount.tier')
                    ->label('Daraja')
                    ->badge()
                    ->placeholder('—')
                    ->formatStateUsing(fn (?string $state): string => $state !== null
                        ? (LoyaltyTier::tryFrom($state)?->label() ?? $state)
                        : '—')
                    ->color(fn (?string $state): string => $state !== null
                        ? (LoyaltyTier::tryFrom($state)?->color() ?? 'gray')
                        : 'gray'),
                Tables\Columns\TextColumn::make('loyaltyAccount.points_balance')
                    ->label('Ball')
                    ->placeholder('—')
                    ->sortable(),
                Tables\Columns\TextColumn::make('total_orders')
                    ->label('Buyurtma')
                    ->sortable(),
                Tables\Columns\TextColumn::make('total_spent')
                    ->label('Xarid')
                    ->formatStateUsing(fn ($state): string => self::fmtSum((int) $state))
                    ->sortable(),
                Tables\Columns\TextColumn::make('last_visit_at')
                    ->label('Oxirgi tashrif')
                    ->dateTime('d.m.Y H:i')
                    ->placeholder('—')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Yaratilgan')
                    ->dateTime('d.m.Y H:i')
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('tenant_id')
                    ->label('Restoran')
                    ->relationship('tenant', 'name')
                    ->searchable()
                    ->preload(),
                Tables\Filters\SelectFilter::make('tier')
                    ->label('Daraja')
                    ->options(collect(LoyaltyTier::cases())
                        ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                        ->toArray())
                    ->query(function ($query, array $data) {
                        if (empty($data['value'])) {
                            return $query;
                        }
                        return $query->whereHas('loyaltyAccount', function ($q) use ($data): void {
                            $q->where('tier', $data['value']);
                        });
                    }),
                Tables\Filters\TernaryFilter::make('has_loyalty')
                    ->label('Sodiqlik akkaunti bor')
                    ->queries(
                        true: fn ($query) => $query->whereHas('loyaltyAccount'),
                        false: fn ($query) => $query->whereDoesntHave('loyaltyAccount'),
                        blank: fn ($query) => $query,
                    ),
                Tables\Filters\Filter::make('last_visit_at')
                    ->form([
                        Forms\Components\DatePicker::make('visited_from')->label('Tashrif: dan'),
                        Forms\Components\DatePicker::make('visited_until')->label('Tashrif: gacha'),
                    ])
                    ->query(function ($query, array $data) {
                        return $query
                            ->when($data['visited_from'] ?? null, fn ($q, $d) => $q->whereDate('last_visit_at', '>=', $d))
                            ->when($data['visited_until'] ?? null, fn ($q, $d) => $q->whereDate('last_visit_at', '<=', $d));
                    }),
                Tables\Filters\Filter::make('created_at')
                    ->form([
                        Forms\Components\DatePicker::make('created_from')->label('Yaratilgan: dan'),
                        Forms\Components\DatePicker::make('created_until')->label('Yaratilgan: gacha'),
                    ])
                    ->query(function ($query, array $data) {
                        return $query
                            ->when($data['created_from'] ?? null, fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
                            ->when($data['created_until'] ?? null, fn ($q, $d) => $q->whereDate('created_at', '<=', $d));
                    }),
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
            'index' => Pages\ListCustomers::route('/'),
            'create' => Pages\CreateCustomer::route('/create'),
            'edit' => Pages\EditCustomer::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        // Audit H1: eager-load loyalty account columns referenced by the
        // table/form. We deliberately do NOT eager-load tenant here on the
        // table render path — the encrypted `phone` column is already joined
        // in via the model cast, and `phone_index` (HMAC) is the only column
        // we expose to the search query. See CustomerResource::table().
        return parent::getEloquentQuery()
            ->with([
                'loyaltyAccount:id,customer_id,tier,points_balance,lifetime_points',
            ])
            ->withoutGlobalScopes([
                \Illuminate\Database\Eloquent\SoftDeletingScope::class,
                'tenant',
            ]);
    }

    private static function fmtSum(int $amount): string
    {
        return number_format($amount, 0, '.', ' ') . ' so\'m';
    }
}
