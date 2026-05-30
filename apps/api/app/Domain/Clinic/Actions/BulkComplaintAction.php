<?php

declare(strict_types=1);

namespace App\Domain\Clinic\Actions;

use App\Domain\Clinic\Models\ClinicComplaint;
use Illuminate\Support\Carbon;

/**
 * Multi-row mutations — set_status, mark_urgent, unmark_urgent, delete.
 * Mirrors the sticky bulk-action bar from the ShifoReyting admin.
 */
class BulkComplaintAction
{
    public const ACTIONS = ['set_status', 'mark_urgent', 'unmark_urgent', 'delete'];

    /**
     * @param array<int, int> $ids
     */
    public function execute(string $action, array $ids, ?string $status = null, ?string $note = null): int
    {
        $ids = array_values(array_filter(array_map('intval', $ids), fn (int $i): bool => $i > 0));

        if ($ids === [] || ! in_array($action, self::ACTIONS, true)) {
            return 0;
        }

        $query = ClinicComplaint::query()->whereIn('id', $ids);

        if ($action === 'delete') {
            return $query->delete();
        }

        if ($action === 'mark_urgent') {
            return $query->update(['is_urgent' => true, 'updated_at' => Carbon::now()]);
        }

        if ($action === 'unmark_urgent') {
            return $query->update(['is_urgent' => false, 'updated_at' => Carbon::now()]);
        }

        // set_status — has to walk rows so we can append the note + stamp
        // resolved_at deterministically.
        if (! in_array($status, ClinicComplaint::STATUSES, true)) {
            return 0;
        }

        $touched = 0;
        $rows = $query->get();
        foreach ($rows as $row) {
            $row->status = $status;
            $row->resolved_at = $status === 'resolved' ? Carbon::now() : null;

            $appendNote = is_string($note) ? trim($note) : '';
            if ($appendNote !== '') {
                $stamp = Carbon::now()->toDateTimeString();
                $existing = $row->summary ?? '';
                $row->summary = ($existing === '' ? '' : $existing . "\n\n")
                    . "[Resolution: {$stamp}] " . $appendNote;
            }

            $row->save();
            $touched++;
        }

        return $touched;
    }
}
