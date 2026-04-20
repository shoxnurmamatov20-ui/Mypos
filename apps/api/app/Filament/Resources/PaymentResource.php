<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Payment\Enums\PaymentProvider;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\PaymentManager;
use App\Filament\Resources\PaymentResource\Pages;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PaymentResource extends Resource
{
    protected static ?string $model = Payment::class;

    protected static ?string $navigationIcon = 'heroicon-o-credit-card';

    protected static ?string $navigationGroup = 'Operatsiyalar';

    protected static ?string $modelLabel = 'To\'lov';

    protected static ?string $pluralModelLabel = 'To\'lovlar';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('To\'lov')
                ->schema([
                    Forms\Components\Placeholder::make('id')
                        ->label('ID')
                        ->content(fn (?Payment $record): string => $record?->id ?? '—'),
                    Forms\Components\Placeholder::make('order_id')
                        ->label('Buyurtma')
                        ->content(fn (?Payment $record): string => $record?->order_id ?? '—'),
                    Forms\Components\Placeholder::make('provider')
                        ->label('Provayder')
                        ->content(fn (?Payment $record): string => $record ? (PaymentProvider::tryFrom($record->provider)?->label() ?? $record->provider) : '—'),
                    Forms\Components\Placeholder::make('status')
                        ->label('Holati')
                        ->content(fn (?Payment $record): string => $record ? (PaymentStatus::tryFrom($record->status)?->label() ?? $record->status) : '—'),
                    Forms\Components\Placeholder::make('amount')
                        ->label('Summa')
                        ->content(fn (?Payment $record): string => self::fmt($record?->amount, $record?->currency)),
                    Forms\Components\Placeholder::make('provider_transaction_id')
                        ->label('Provayder tranzaksiya ID')
                        ->content(fn (?Payment $record): string => $record?->provider_transaction_id ?? '—'),
                    Forms\Components\Placeholder::make('failure_reason')
                        ->label('Xato sababi')
                        ->content(fn (?Payment $record): string => $record?->failure_reason ?? '—'),
                ])
                ->columns(2),

            Forms\Components\Section::make('Vaqtlar')
                ->schema([
                    Forms\Components\Placeholder::make('authorized_at')
                        ->label('Avtorizatsiya')
                        ->content(fn (?Payment $record): string => $record?->authorized_at?->format('d.m.Y H:i') ?? '—'),
                    Forms\Components\Placeholder::make('captured_at')
                        ->label('Qabul qilindi')
                        ->content(fn (?Payment $record): string => $record?->captured_at?->format('d.m.Y H:i') ?? '—'),
                    Forms\Components\Placeholder::make('refunded_at')
                        ->label('Qaytarildi')
                        ->content(fn (?Payment $record): string => $record?->refunded_at?->format('d.m.Y H:i') ?? '—'),
                    Forms\Components\Placeholder::make('failed_at')
                        ->label('Muvaffaqiyatsiz')
                        ->content(fn (?Payment $record): string => $record?->failed_at?->format('d.m.Y H:i') ?? '—'),
                ])
                ->columns(2)
                ->collapsed(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Sana')
                    ->dateTime('d.m.Y H:i')
                    ->sortable(),
                Tables\Columns\TextColumn::make('tenant.name')
                    ->label('Restoran')
                    ->badge()
                    ->color('gray')
                    ->searchable(),
                Tables\Columns\TextColumn::make('provider')
                    ->label('Provayder')
                    ->badge()
                    ->color(fn (string $state): string => PaymentProvider::tryFrom($state)?->color() ?? 'gray')
                    ->formatStateUsing(fn (string $state): string => PaymentProvider::tryFrom($state)?->label() ?? $state),
                Tables\Columns\TextColumn::make('status')
                    ->label('Holati')
                    ->badge()
                    ->color(fn (string $state): string => PaymentStatus::tryFrom($state)?->color() ?? 'gray')
                    ->formatStateUsing(fn (string $state): string => PaymentStatus::tryFrom($state)?->label() ?? $state),
                Tables\Columns\TextColumn::make('amount')
                    ->label('Summa')
                    ->formatStateUsing(fn ($state, Payment $record): string => self::fmt((int) $state, $record->currency))
                    ->sortable(),
                Tables\Columns\TextColumn::make('provider_transaction_id')
                    ->label('Tranzaksiya ID')
                    ->toggleable()
                    ->searchable()
                    ->placeholder('—'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('tenant_id')
                    ->label('Restoran')
                    ->relationship('tenant', 'name')
                    ->searchable()
                    ->preload(),
                Tables\Filters\SelectFilter::make('provider')
                    ->label('Provayder')
                    ->options(collect(PaymentProvider::cases())
                        ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                        ->toArray()),
                Tables\Filters\SelectFilter::make('status')
                    ->label('Holati')
                    ->options(collect(PaymentStatus::cases())
                        ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                        ->toArray()),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\Action::make('refund')
                    ->label('Qaytarish')
                    ->icon('heroicon-o-arrow-uturn-left')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (Payment $record): bool => $record->status === PaymentStatus::Captured->value)
                    ->action(function (Payment $record): void {
                        /** @var PaymentManager $manager */
                        $manager = app(PaymentManager::class);
                        $manager->driver($record->provider)->refund($record, (int) $record->amount);
                    }),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPayments::route('/'),
            'view' => Pages\ViewPayment::route('/{record}'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit($record): bool
    {
        return false;
    }

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        return parent::getEloquentQuery()
            ->withoutGlobalScopes(['tenant']);
    }

    private static function fmt(?int $amount, ?string $currency): string
    {
        if ($amount === null) {
            return '—';
        }
        $formatted = number_format($amount, 0, '.', ' ');
        return $currency === 'UZS' || $currency === null
            ? $formatted . ' so\'m'
            : $formatted . ' ' . $currency;
    }
}
