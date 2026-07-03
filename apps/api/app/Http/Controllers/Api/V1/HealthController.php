<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

/**
 * GET /api/v1/health — deep readiness probe for uptime monitors and Coolify.
 *
 * Component semantics:
 *   - db / redis / cache: round-trip with millisecond latency
 *   - queue: Horizon master heartbeat present in Redis
 *   - rls_runtime: true when the HTTP runtime connects as a role that is
 *     subject to Row-Level Security (non-owner, NOBYPASSRLS) — the ADR-0006
 *     production posture. False = web still on the table-owner role.
 *
 * Returns 200 when every critical component is ok, 503 otherwise, so plain
 * HTTP uptime checks alert without parsing the body. Kept intentionally
 * lean: no schema queries, no table counts — safe at 60 req/min.
 */
class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $components = [
            'db' => $this->check(fn () => DB::select('SELECT 1')),
            'redis' => $this->check(fn () => Redis::connection()->ping()),
            'cache' => $this->check(function (): void {
                $key = 'health:probe:' . Str::random(8);
                Cache::put($key, '1', 5);
                if (Cache::get($key) !== '1') {
                    throw new \RuntimeException('cache roundtrip failed');
                }
                Cache::forget($key);
            }),
            'queue' => $this->check(function (): void {
                // Horizon keeps its master heartbeat set as a ZSET.
                $masters = (int) Redis::connection('horizon')->zcard('masters');
                if ($masters < 1) {
                    throw new \RuntimeException('no horizon master');
                }
            }),
        ];

        $healthy = ! in_array('fail', array_column($components, 'status'), true);

        return response()->json([
            'status' => $healthy ? 'ok' : 'degraded',
            'service' => 'mypos-api',
            'version' => '0.1.0',
            'timestamp' => now()->toIso8601String(),
            'components' => $components,
            'rls_runtime' => $this->rlsRuntimeBound(),
        ], $healthy ? 200 : 503);
    }

    /** @return array{status: string, latency_ms?: float} */
    private function check(callable $probe): array
    {
        $start = hrtime(true);

        try {
            $probe();

            return [
                'status' => 'ok',
                'latency_ms' => round((hrtime(true) - $start) / 1e6, 1),
            ];
        } catch (\Throwable) {
            return ['status' => 'fail'];
        }
    }

    /**
     * True when this connection cannot bypass RLS: not a superuser, no
     * BYPASSRLS, and not the owner of a representative protected table.
     */
    private function rlsRuntimeBound(): bool
    {
        try {
            if (DB::connection()->getDriverName() !== 'pgsql') {
                return false;
            }

            $row = DB::selectOne("
                SELECT r.rolsuper OR r.rolbypassrls OR (c.relowner = r.oid) AS can_bypass
                FROM pg_roles r
                CROSS JOIN pg_class c
                WHERE r.rolname = current_user AND c.oid = 'public.orders'::regclass
            ");

            return $row !== null && $row->can_bypass === false;
        } catch (\Throwable) {
            return false;
        }
    }
}
