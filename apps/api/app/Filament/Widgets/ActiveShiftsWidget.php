<?php

declare(strict_types=1);

namespace App\Filament\Widgets;

use App\Domain\Auth\Enums\Role;
use App\Domain\Employee\Enums\EmployeeRole;
use App\Domain\Employee\Enums\ShiftStatus;
use App\Domain\Employee\Models\Shift;
use App\Domain\Employee\Models\ShiftBreak;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Database\Eloquent\Builder;

class ActiveShiftsWidget extends TableWidget
{
    protected static ?string $heading = 'Hozir ish bajarayotgan xodimlar';

    protected int|string|array $columnSpan = 'full';

    protected static ?int $sort = 2;

    /**
     * Polling removed (audit H4) — refreshed via Echo broadcast events.
     * See {@see self::getListeners()} for the Echo channels we subscribe to.
     */
    protected static ?string $pollingInterval = null;

    /**
     * Echo subscription stubs — Agent B3 wires the actual broadcast events on
     * the `tenant.{id}.dashboard` private channel. Once events fire, this
     * widget refreshes its table without polling.
     *
     * @return array<string, string>
     */
    public function getListeners(): array
    {
        $tenantId = optional(auth()->user())->tenant_id;
        if ($tenantId === null) {
            return [];
        }
        return [
            "echo-private:tenant.{$tenantId}.dashboard,.shift.opened" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.shift.closed" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.shift.break.started" => '$refresh',
            "echo-private:tenant.{$tenantId}.dashboard,.shift.break.ended" => '$refresh',
        ];
    }

    public function table(Table $table): Table
    {
        return $table
            ->query(self::query())
            ->defaultSort('actual_start', 'asc')
            ->columns([
                Tables\Columns\TextColumn::make('employee.user.name')
                    ->label('Xodim')
                    ->weight('semibold')
                    ->searchable(),
                Tables\Columns\TextColumn::make('employee.position')
                    ->label('Lavozim')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => $state !== null
                        ? (EmployeeRole::tryFrom($state)?->label()
                            ?? Role::tryFrom($state)?->label()
                            ?? $state)
                        : '—')
                    ->color('primary'),
                Tables\Columns\TextColumn::make('actual_start')
                    ->label('Boshlangan')
                    ->dateTime('H:i')
                    ->description(fn (Shift $record): string => $record->actual_start?->format('d.m.Y') ?? ''),
                Tables\Columns\TextColumn::make('elapsed')
                    ->label('Davomiyligi')
                    ->state(fn (Shift $record): string => self::formatElapsed($record))
                    ->badge()
                    ->color('info'),
                Tables\Columns\TextColumn::make('break_state')
                    ->label('Tanaffus')
                    ->state(fn (Shift $record): string => self::breakState($record))
                    ->badge()
                    ->color(fn (Shift $record): string => self::breakColor($record)),
                Tables\Columns\TextColumn::make('scheduled_end')
                    ->label('Tugash rejasi')
                    ->dateTime('H:i')
                    ->placeholder('—')
                    ->toggleable(),
            ])
            ->paginated([5, 10, 25])
            ->emptyStateHeading('Hozir hech kim ishlamayapti')
            ->emptyStateDescription("Smena boshlanganda bu yerda ko'rinadi");
    }

    /** @return Builder<Shift> */
    protected static function query(): Builder
    {
        // Audit H2: eager-load every relation the row callbacks read so we
        // don't fan out to N+1 break queries when many shifts are open.
        return Shift::query()
            ->with([
                'employee.user',
                'breaks' => fn ($q) => $q
                    ->whereNull('ended_at')
                    ->orderByDesc('started_at'),
            ])
            ->where('status', ShiftStatus::Open->value);
    }

    private static function formatElapsed(Shift $shift): string
    {
        if ($shift->actual_start === null) {
            return '—';
        }
        $minutes = max(0, (int) $shift->actual_start->diffInMinutes(now()));
        $hours = intdiv($minutes, 60);
        $mins = $minutes % 60;
        if ($hours === 0) {
            return $mins . 'm';
        }
        return $hours . 'h ' . $mins . 'm';
    }

    /**
     * Read the open break (if any) from the eager-loaded relation. Falls back
     * to a fresh query if `breaks` was not pre-loaded — see audit H2.
     */
    private static function openBreak(Shift $shift): ?ShiftBreak
    {
        if ($shift->relationLoaded('breaks')) {
            /** @var ShiftBreak|null $break */
            $break = $shift->breaks->first();
            return $break;
        }
        return $shift->breaks()
            ->whereNull('ended_at')
            ->orderByDesc('started_at')
            ->first();
    }

    private static function breakState(Shift $shift): string
    {
        $break = self::openBreak($shift);
        if ($break === null) {
            return 'Ishda';
        }
        $duration = max(0, (int) $break->started_at->diffInMinutes(now()));
        return "Tanaffusda ({$duration}m)";
    }

    private static function breakColor(Shift $shift): string
    {
        return self::openBreak($shift) === null ? 'success' : 'warning';
    }
}
