<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\OrderType;
use App\Domain\Order\Models\Order;
use App\Filament\Resources\OrderResource\Pages;
use App\Filament\Resources\OrderResource\RelationManagers\ItemsRelationManager;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class OrderResource extends Resource
{
    protected static ?string $model = Order::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-cart';

    protected static ?string $navigationGroup = 'Operatsiyalar';

    protected static ?string $modelLabel = 'Buyurtma';

    protected static ?string $pluralModelLabel = 'Buyurtmalar';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Buyurtma')
                ->schema([
                    Forms\Components\Placeholder::make('order_no')
                        ->label('Buyurtma №')
                        ->content(fn (?Order $record): string => $record?->order_no ?? '—'),
                    Forms\Components\Placeholder::make('tenant')
                        ->label('Restoran')
                        ->content(fn (?Order $record): string => $record?->tenant?->name ?? '—'),
                    Forms\Components\Placeholder::make('type')
                        ->label('Turi')
                        ->content(fn (?Order $record): string => $record ? (OrderType::tryFrom($record->type)?->label() ?? $record->type) : '—'),
                    Forms\Components\Placeholder::make('status')
                        ->label('Holati')
                        ->content(fn (?Order $record): string => $record ? (OrderStatus::tryFrom($record->status)?->label() ?? $record->status) : '—'),
                    Forms\Components\Placeholder::make('payment_status')
                        ->label('To\'lov holati')
                        ->content(fn (?Order $record): string => $record?->payment_status ?? '—'),
                    Forms\Components\Placeholder::make('payment_method')
                        ->label('To\'lov usuli')
                        ->content(fn (?Order $record): string => $record?->payment_method ?? '—'),
                ])
                ->columns(3),

            Forms\Components\Section::make('Kontekst')
                ->schema([
                    Forms\Components\Placeholder::make('table')
                        ->label('Stol')
                        ->content(fn (?Order $record): string => $record?->table?->name ?? '—'),
                    Forms\Components\Placeholder::make('employee')
                        ->label('Xodim')
                        ->content(fn (?Order $record): string => $record?->employee?->name ?? '—'),
                    Forms\Components\Placeholder::make('guest_count')
                        ->label('Mehmonlar')
                        ->content(fn (?Order $record): string => (string) ($record?->guest_count ?? '—')),
                ])
                ->columns(3),

            Forms\Components\Section::make('Summalar')
                ->schema([
                    Forms\Components\Placeholder::make('subtotal_amount')
                        ->label('Subtotal')
                        ->content(fn (?Order $record): string => self::fmt($record?->subtotal_amount, $record?->currency)),
                    Forms\Components\Placeholder::make('tax_amount')
                        ->label('Soliq')
                        ->content(fn (?Order $record): string => self::fmt($record?->tax_amount, $record?->currency)),
                    Forms\Components\Placeholder::make('discount_amount')
                        ->label('Chegirma')
                        ->content(fn (?Order $record): string => self::fmt($record?->discount_amount, $record?->currency)),
                    Forms\Components\Placeholder::make('tip_amount')
                        ->label('Chaypul')
                        ->content(fn (?Order $record): string => self::fmt($record?->tip_amount, $record?->currency)),
                    Forms\Components\Placeholder::make('service_charge_amount')
                        ->label('Xizmat haqi')
                        ->content(fn (?Order $record): string => self::fmt($record?->service_charge_amount, $record?->currency)),
                    Forms\Components\Placeholder::make('total_amount')
                        ->label('Jami')
                        ->content(fn (?Order $record): string => self::fmt($record?->total_amount, $record?->currency)),
                    Forms\Components\Placeholder::make('paid_amount')
                        ->label('To\'langan')
                        ->content(fn (?Order $record): string => self::fmt($record?->paid_amount, $record?->currency)),
                ])
                ->columns(3),

            Forms\Components\Section::make('Vaqtlar')
                ->schema([
                    Forms\Components\Placeholder::make('placed_at')
                        ->label('Berilgan')
                        ->content(fn (?Order $record): string => $record?->placed_at?->format('d.m.Y H:i') ?? '—'),
                    Forms\Components\Placeholder::make('prepared_at')
                        ->label('Tayyor')
                        ->content(fn (?Order $record): string => $record?->prepared_at?->format('d.m.Y H:i') ?? '—'),
                    Forms\Components\Placeholder::make('served_at')
                        ->label('Berilgan stolga')
                        ->content(fn (?Order $record): string => $record?->served_at?->format('d.m.Y H:i') ?? '—'),
                    Forms\Components\Placeholder::make('paid_at')
                        ->label('To\'langan sana')
                        ->content(fn (?Order $record): string => $record?->paid_at?->format('d.m.Y H:i') ?? '—'),
                    Forms\Components\Placeholder::make('completed_at')
                        ->label('Yakunlangan')
                        ->content(fn (?Order $record): string => $record?->completed_at?->format('d.m.Y H:i') ?? '—'),
                    Forms\Components\Placeholder::make('cancelled_at')
                        ->label('Bekor qilingan')
                        ->content(fn (?Order $record): string => $record?->cancelled_at?->format('d.m.Y H:i') ?? '—'),
                ])
                ->columns(3)
                ->collapsed(),

            Forms\Components\Section::make('Izoh')
                ->schema([
                    Forms\Components\Placeholder::make('notes')
                        ->label('Izoh')
                        ->content(fn (?Order $record): string => $record?->notes ?? '—'),
                ])
                ->collapsed(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('order_no')
                    ->label('№')
                    ->searchable()
                    ->weight('semibold'),
                Tables\Columns\TextColumn::make('tenant.name')
                    ->label('Restoran')
                    ->badge()
                    ->color('gray')
                    ->searchable(),
                Tables\Columns\TextColumn::make('type')
                    ->label('Turi')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => OrderType::tryFrom($state)?->label() ?? $state)
                    ->color('gray'),
                Tables\Columns\TextColumn::make('status')
                    ->label('Holati')
                    ->badge()
                    ->color(fn (string $state): string => OrderStatus::tryFrom($state)?->color() ?? 'gray')
                    ->formatStateUsing(fn (string $state): string => OrderStatus::tryFrom($state)?->label() ?? $state),
                Tables\Columns\TextColumn::make('table.name')
                    ->label('Stol')
                    ->placeholder('—')
                    ->color('gray'),
                Tables\Columns\TextColumn::make('total_amount')
                    ->label('Jami')
                    ->formatStateUsing(fn ($state, Order $record): string => self::fmt((int) $state, $record->currency))
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Yaratilgan')
                    ->dateTime('d.m.Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('tenant_id')
                    ->label('Restoran')
                    ->relationship('tenant', 'name')
                    ->searchable()
                    ->preload(),
                Tables\Filters\SelectFilter::make('status')
                    ->label('Holati')
                    ->options(collect(OrderStatus::cases())
                        ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                        ->toArray()),
                Tables\Filters\SelectFilter::make('type')
                    ->label('Turi')
                    ->options(collect(OrderType::cases())
                        ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                        ->toArray()),
                Tables\Filters\Filter::make('created_at')
                    ->form([
                        Forms\Components\DatePicker::make('created_from')->label('Dan'),
                        Forms\Components\DatePicker::make('created_until')->label('Gacha'),
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
                Tables\Actions\Action::make('changeStatus')
                    ->label('Statusni o\'zgartirish')
                    ->icon('heroicon-o-arrow-path')
                    ->color('warning')
                    ->form([
                        Forms\Components\Select::make('status')
                            ->label('Yangi status')
                            ->options(collect(OrderStatus::cases())
                                ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
                                ->toArray())
                            ->required(),
                    ])
                    ->action(function (Order $record, array $data): void {
                        $record->update(['status' => $data['status']]);
                    }),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\ForceDeleteBulkAction::make(),
                    Tables\Actions\RestoreBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            ItemsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListOrders::route('/'),
            'view' => Pages\ViewOrder::route('/{record}'),
            'edit' => Pages\EditOrder::route('/{record}/edit'),
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
