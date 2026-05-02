<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use App\Domain\Tenant\Actions\VerifyDomainAction;
use App\Domain\Tenant\Models\TenantDomain;
use App\Domain\Tenant\Services\TierFeatures;
use App\Filament\Resources\TenantDomainResource\Pages;
use App\Filament\Resources\TenantDomainResource\Schemas\TenantDomainFormSchema;
use App\Models\User;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletingScope;

/**
 * Custom Domain manager.
 *
 * Each row represents a hostname attached to a tenant
 * (e.g. `shop.lavashhouse.com`). The lifecycle is:
 *   1. Create   — owner submits the hostname (Wizard step 1).
 *   2. Verify   — owner sets the DNS TXT/CNAME, clicks "Verify" (steps 2–3).
 *   3. SSL      — Caddy issues the certificate; UI auto-polls (step 4).
 *
 * Tenant scoping is automatic via `BelongsToTenant`. Super admins see all
 * domains (the trait returns null when the user is super-admin). The list
 * page also exposes a per-tenant filter for super-admin convenience.
 *
 * Tier gate: only Plus+ tenants may create custom domains. Non-Plus users
 * still see the list (so they can see what they could have) but the
 * "Create" action becomes an "Upgrade" CTA — see ListTenantDomains.
 */
class TenantDomainResource extends Resource
{
    protected static ?string $model = TenantDomain::class;

    protected static ?string $navigationIcon = 'heroicon-o-globe-alt';

    protected static ?string $navigationGroup = 'Settings';

    protected static ?int $navigationSort = 11;

    /** @var array<int, string> */
    protected static array $globalSearchAttributes = ['domain'];

    public static function getNavigationLabel(): string
    {
        return __('domain.nav.label');
    }

    public static function getModelLabel(): string
    {
        return __('domain.model.label');
    }

    public static function getPluralModelLabel(): string
    {
        return __('domain.model.plural');
    }

    /** @return array<int, string> */
    public static function getGloballySearchableAttributes(): array
    {
        return self::$globalSearchAttributes;
    }

    public static function form(Form $form): Form
    {
        return $form->schema(TenantDomainFormSchema::sections());
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns(self::tableColumns())
            ->filters(self::tableFilters())
            ->actions(self::rowActions())
            ->bulkActions(self::bulkActions());
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTenantDomains::route('/'),
            'create' => Pages\CreateTenantDomain::route('/create'),
            'view' => Pages\ViewTenantDomain::route('/{record}'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['tenant'])
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }

    public static function canCreate(): bool
    {
        $user = auth()->user();
        if (! $user instanceof User) {
            return false;
        }
        if ($user->is_super_admin === true) {
            return true;
        }
        $tenant = $user->tenant;
        if ($tenant === null) {
            return false;
        }
        return TierFeatures::for($tenant->getAttribute('tier'))->canUseCustomDomain();
    }

    /** @return array<int, Tables\Columns\Column> */
    private static function tableColumns(): array
    {
        return [
            Tables\Columns\TextColumn::make('domain')
                ->label(__('domain.col.domain'))
                ->searchable()
                ->copyable()
                ->weight('semibold'),
            Tables\Columns\TextColumn::make('tenant.name')
                ->label(__('domain.col.tenant'))
                ->toggleable()
                ->visible(fn (): bool => self::isCurrentUserSuperAdmin())
                ->searchable(['tenants.name']),
            Tables\Columns\IconColumn::make('is_primary')
                ->label(__('domain.col.primary'))
                ->boolean()
                ->trueIcon('heroicon-s-star')
                ->falseIcon('heroicon-o-star')
                ->trueColor('warning')
                ->falseColor('gray'),
            Tables\Columns\TextColumn::make('is_verified')
                ->label(__('domain.col.verification'))
                ->state(fn (TenantDomain $r): string => $r->is_verified
                    ? __('domain.status.verified')
                    : __('domain.status.pending'))
                ->badge()
                ->color(fn (TenantDomain $r): string => $r->is_verified ? 'success' : 'warning'),
            Tables\Columns\TextColumn::make('ssl_status')
                ->label(__('domain.col.ssl'))
                ->badge()
                ->formatStateUsing(fn (string $s): string => __("domain.ssl.{$s}"))
                ->color(fn (string $s): string => self::sslStatusColor($s)),
            Tables\Columns\TextColumn::make('verification_method')
                ->label(__('domain.col.method'))
                ->badge()
                ->color('gray')
                ->toggleable(isToggledHiddenByDefault: true),
            Tables\Columns\TextColumn::make('last_checked_at')
                ->label(__('domain.col.last_checked'))
                ->since()
                ->placeholder('—')
                ->toggleable(),
            Tables\Columns\TextColumn::make('ssl_issued_at')
                ->label(__('domain.col.ssl_issued'))
                ->dateTime('d.m.Y H:i')
                ->placeholder('—')
                ->toggleable(isToggledHiddenByDefault: true),
            Tables\Columns\TextColumn::make('created_at')
                ->label(__('domain.col.created'))
                ->dateTime('d.m.Y H:i')
                ->sortable()
                ->toggleable(isToggledHiddenByDefault: true),
        ];
    }

    /** @return array<int, Tables\Filters\BaseFilter> */
    private static function tableFilters(): array
    {
        return [
            Tables\Filters\SelectFilter::make('ssl_status')
                ->label(__('domain.col.ssl'))
                ->options([
                    'pending' => __('domain.ssl.pending'),
                    'provisioning' => __('domain.ssl.provisioning'),
                    'active' => __('domain.ssl.active'),
                    'error' => __('domain.ssl.error'),
                ]),
            Tables\Filters\TernaryFilter::make('is_verified')
                ->label(__('domain.col.verification'))
                ->placeholder(__('domain.filter.all'))
                ->trueLabel(__('domain.status.verified'))
                ->falseLabel(__('domain.status.pending')),
            Tables\Filters\TernaryFilter::make('is_primary')
                ->label(__('domain.col.primary')),
            Tables\Filters\TrashedFilter::make(),
        ];
    }

    /** @return array<int, Tables\Actions\Action|Tables\Actions\ActionGroup> */
    private static function rowActions(): array
    {
        return [
            Tables\Actions\ViewAction::make(),
            Tables\Actions\Action::make('reverify')
                ->label(__('domain.actions.reverify'))
                ->icon('heroicon-o-arrow-path')
                ->color('info')
                ->action(function (TenantDomain $record): void {
                    $result = app(VerifyDomainAction::class)->execute($record);
                    $verified = (bool) ($result['verified'] ?? false);
                    Notification::make()
                        ->title($verified
                            ? __('domain.status.verified')
                            : __('domain.notifications.verify_failed_title'))
                        ->body($verified ? null : (string) ($result['reason'] ?? ''))
                        ->{$verified ? 'success' : 'warning'}()
                        ->send();
                }),
            Tables\Actions\Action::make('setPrimary')
                ->label(__('domain.actions.set_primary'))
                ->icon('heroicon-o-star')
                ->color('warning')
                ->visible(fn (TenantDomain $r): bool => ! $r->is_primary && $r->is_verified)
                ->requiresConfirmation()
                ->action(function (TenantDomain $record): void {
                    self::promoteToPrimary($record);
                    Notification::make()
                        ->title(__('domain.notifications.primary_updated'))
                        ->success()
                        ->send();
                }),
            Tables\Actions\DeleteAction::make(),
        ];
    }

    /** @return array<int, Tables\Actions\BulkAction|Tables\Actions\BulkActionGroup> */
    private static function bulkActions(): array
    {
        return [
            Tables\Actions\BulkActionGroup::make([
                Tables\Actions\BulkAction::make('verify')
                    ->label(__('domain.actions.verify_selected'))
                    ->icon('heroicon-o-check-badge')
                    ->color('info')
                    ->action(function (\Illuminate\Support\Collection $records): void {
                        $action = app(VerifyDomainAction::class);
                        $verifiedCount = 0;
                        foreach ($records as $record) {
                            /** @var TenantDomain $record */
                            $result = $action->execute($record);
                            if (($result['verified'] ?? false) === true) {
                                $verifiedCount++;
                            }
                        }
                        Notification::make()
                            ->title(__('domain.notifications.verify_started_bulk'))
                            ->body((string) $verifiedCount . ' / ' . (string) $records->count())
                            ->success()
                            ->send();
                    }),
                Tables\Actions\DeleteBulkAction::make(),
                Tables\Actions\RestoreBulkAction::make(),
            ]),
        ];
    }

    /**
     * Promote a domain to primary, demoting any existing primary for the
     * same tenant. Mirrors the partial unique index from the migration.
     */
    private static function promoteToPrimary(TenantDomain $record): void
    {
        TenantDomain::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $record->tenant_id)
            ->where('id', '!=', $record->id)
            ->update(['is_primary' => false]);
        $record->forceFill(['is_primary' => true])->save();
    }

    private static function sslStatusColor(string $status): string
    {
        return match ($status) {
            'active' => 'success',
            'provisioning' => 'info',
            'pending' => 'warning',
            'error' => 'danger',
            default => 'gray',
        };
    }

    private static function isCurrentUserSuperAdmin(): bool
    {
        $user = auth()->user();
        return $user instanceof User && $user->is_super_admin === true;
    }
}
