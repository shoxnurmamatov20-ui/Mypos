<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Domain\SuperAdmin\Models\AuditLog;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\SuperAdmin\AuditLogResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AuditLogController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min(200, (int) $request->query('per_page', 50)));

        $query = AuditLog::query();

        if (($actor = (string) $request->query('actor', '')) !== '') {
            $query->where(function ($q) use ($actor): void {
                $q->where('actor_label', 'like', '%' . $actor . '%')
                    ->orWhere('actor_user_uuid', $actor);
            });
        }
        if (($action = (string) $request->query('action', '')) !== '') {
            $query->where('action', $action);
        }
        if (($severity = (string) $request->query('severity', '')) !== '') {
            $query->where('severity', $severity);
        }
        if (($tenantId = (string) $request->query('tenant_id', '')) !== '') {
            $query->where('tenant_id', $tenantId);
        }
        if (($from = (string) $request->query('from', '')) !== '') {
            $query->where('created_at', '>=', $from);
        }
        if (($to = (string) $request->query('to', '')) !== '') {
            $query->where('created_at', '<=', $to);
        }
        if (($q = trim((string) $request->query('q', ''))) !== '') {
            $like = '%' . $q . '%';
            $query->where(function ($qq) use ($like): void {
                $qq->where('action', 'like', $like)
                    ->orWhere('subject_label', 'like', $like)
                    ->orWhere('actor_label', 'like', $like);
            });
        }

        $logs = $query->orderByDesc('created_at')->paginate($perPage);

        return AuditLogResource::collection($logs);
    }

    public function actions(): JsonResponse
    {
        $values = AuditLog::query()
            ->select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action')
            ->values();

        return response()->json(['data' => $values]);
    }
}
