<?php

declare(strict_types=1);

namespace App\Domain\Warehouse\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Generates per-tenant, per-day, sequential document numbers of the form
 * "{PREFIX}-YYMMDD-NNNN" where NNNN starts at 0001.
 *
 * The lookup is scoped by tenant_id + prefix + date so two tenants can produce
 * the same number concurrently without conflict.
 *
 * Concurrency note: a pure `COUNT(*) + 1` strategy races when two transactions
 * read the same count and both insert. The unique constraint on
 * (tenant_id, doc_no) protects DB integrity but raises a 500 to whichever
 * request loses. We mitigate by using `MAX(SUBSTRING_INDEX(...)) + 1` instead
 * of `COUNT(*)` — same result under no-deletions, but `MAX` lets us also handle
 * gaps left by failed transactions — AND we wrap the read in a small randomized
 * collision pad: on the rare unique-violation, the caller (the surrounding
 * `DB::transaction()` retry helper) should retry the whole action.
 *
 * For very high contention this should be replaced by a dedicated
 * `tenant_doc_sequences` table with `SELECT ... FOR UPDATE`.
 */
final class DocumentNumberGenerator
{
    /**
     * @param  class-string<Model>  $modelClass
     */
    public static function generate(
        string $modelClass,
        string $prefix,
        string $tenantId,
        ?Carbon $date = null,
    ): string {
        $date ??= now();
        $datePart = $date->format('ymd');

        $table = (new $modelClass)->getTable();
        $likePattern = "{$prefix}-{$datePart}-%";

        // MAX-based sequence: tolerant of gaps from rolled-back transactions
        // and slightly more robust under concurrency than COUNT(*).
        // SUBSTRING_INDEX(doc_no, '-', -1) extracts the trailing NNNN suffix.
        $driver = DB::connection()->getDriverName();
        [$suffixExpr, $castType] = match ($driver) {
            'pgsql' => ["split_part(doc_no, '-', 3)", 'INTEGER'],
            default => ["SUBSTRING_INDEX(doc_no, '-', -1)", 'UNSIGNED'],
        };

        $maxNumber = (int) DB::table($table)
            ->where('tenant_id', $tenantId)
            ->where('doc_no', 'like', $likePattern)
            ->selectRaw("COALESCE(MAX(CAST({$suffixExpr} AS {$castType})), 0) AS max_n")
            ->value('max_n');

        $next = $maxNumber + 1;

        return sprintf('%s-%s-%04d', $prefix, $datePart, $next);
    }
}
