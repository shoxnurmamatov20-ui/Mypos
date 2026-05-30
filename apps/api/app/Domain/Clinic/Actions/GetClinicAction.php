<?php

declare(strict_types=1);

namespace App\Domain\Clinic\Actions;

use App\Domain\Clinic\Models\Clinic;

/**
 * Loads one clinic with departments (+ doctors_count), doctors (with their
 * department), the 20 most-recent feedback rows, and all open complaints.
 *
 * Returns null when the id does not exist — controller maps that to 404.
 */
class GetClinicAction
{
    public function execute(int $id): ?Clinic
    {
        return Clinic::query()
            ->with([
                'departments' => function ($query): void {
                    $query->withCount('doctors')->orderBy('name');
                },
                'doctors' => function ($query): void {
                    $query->with('department:id,name')->orderBy('name');
                },
                'feedback' => function ($query): void {
                    $query->orderByDesc('submitted_at')->limit(20);
                },
                'complaints' => function ($query): void {
                    $query->where('status', 'open')->orderByDesc('created_at');
                },
            ])
            ->find($id);
    }
}
