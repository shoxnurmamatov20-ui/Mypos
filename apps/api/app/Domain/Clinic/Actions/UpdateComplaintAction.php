<?php

declare(strict_types=1);

namespace App\Domain\Clinic\Actions;

use App\Domain\Clinic\Models\ClinicComplaint;
use Illuminate\Support\Carbon;

/**
 * Mutates a single complaint — status / urgency / resolution note. Mirrors
 * the ShifoReyting admin "Change status" + "Toggle urgent" flow. The
 * resolution_note (when present) is appended to summary so the audit
 * trail lives with the row instead of a separate column.
 */
class UpdateComplaintAction
{
    /**
     * @param array{
     *     status?: string|null,
     *     is_urgent?: bool|null,
     *     severity?: string|null,
     *     resolution_note?: string|null
     * } $changes
     */
    public function execute(ClinicComplaint $complaint, array $changes): ClinicComplaint
    {
        if (
            isset($changes['status']) &&
            in_array($changes['status'], ClinicComplaint::STATUSES, true)
        ) {
            $complaint->status = $changes['status'];

            // Resolved auto-stamps `resolved_at`; any other status clears it
            // so the SLA / avg-resolution metrics stay honest when a
            // complaint is reopened.
            $complaint->resolved_at = $changes['status'] === 'resolved'
                ? Carbon::now()
                : null;
        }

        if (
            isset($changes['severity']) &&
            in_array($changes['severity'], ClinicComplaint::SEVERITIES, true)
        ) {
            $complaint->severity = $changes['severity'];
        }

        if (array_key_exists('is_urgent', $changes) && $changes['is_urgent'] !== null) {
            $complaint->is_urgent = (bool) $changes['is_urgent'];
        }

        $note = isset($changes['resolution_note']) ? trim((string) $changes['resolution_note']) : '';
        if ($note !== '') {
            $stamp = Carbon::now()->toDateTimeString();
            $existing = $complaint->summary ?? '';
            $complaint->summary = ($existing === '' ? '' : $existing . "\n\n")
                . "[Resolution: {$stamp}] " . $note;
        }

        $complaint->save();

        return $complaint->fresh([
            'clinic:id,name,region',
            'department:id,name',
            'doctor:id,name,specialty',
        ]) ?? $complaint;
    }
}
