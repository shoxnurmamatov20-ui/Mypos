<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * One-off data bridge: copies every domain table from the legacy MySQL
 * database (ADR-0005 era) into the current PostgreSQL database (ADR-0006).
 *
 * Usage (after `php artisan migrate` has built the Postgres schema):
 *
 *   LEGACY_DB_HOST=127.0.0.1 LEGACY_DB_DATABASE=mypos \
 *   php artisan db:migrate-from-mysql --truncate
 *
 * Design notes:
 *   - The target connection runs with `session_replication_role = replica`
 *     during the copy so FK ordering does not matter (requires a superuser /
 *     owner connection — which migrations need anyway).
 *   - MySQL tinyint(1) values are coerced to real booleans for every target
 *     column whose type is boolean.
 *   - Identity/serial sequences are re-synced to MAX(id) afterwards.
 *   - Framework/ephemeral tables (cache, sessions, queue, tokens) are
 *     skipped — they regenerate at runtime.
 *
 * See docs/runbooks/mysql-to-postgres-migration.md for the full runbook.
 */
class MigrateFromMysqlCommand extends Command
{
    protected $signature = 'db:migrate-from-mysql
        {--source=mysql : Source connection name (config/database.php)}
        {--target=pgsql : Target connection name}
        {--tables= : Comma-separated subset of tables to copy}
        {--truncate : TRUNCATE each target table before copying}
        {--dry-run : List the plan without writing anything}';

    protected $description = 'Copy all data from the legacy MySQL database into PostgreSQL (ADR-0006)';

    /** Ephemeral/framework tables that must NOT be copied. @var list<string> */
    private const SKIP = [
        'migrations',
        'cache', 'cache_locks',
        'sessions',
        'jobs', 'job_batches', 'failed_jobs',
        'password_reset_tokens',
        'personal_access_tokens', // Sanctum tokens — users re-authenticate.
    ];

    public function handle(): int
    {
        $source = (string) $this->option('source');
        $target = (string) $this->option('target');

        $tables = $this->resolveTables($source, $target);
        if ($tables === []) {
            $this->error('No overlapping tables between source and target.');

            return self::FAILURE;
        }

        $this->info(sprintf('Copying %d tables: %s → %s', count($tables), $source, $target));

        if ($this->option('dry-run')) {
            foreach ($tables as $table) {
                $count = DB::connection($source)->table($table)->count();
                $this->line(sprintf('  %-40s %8d rows', $table, $count));
            }
            $this->comment('Dry run — nothing written.');

            return self::SUCCESS;
        }

        $booleanColumns = $this->booleanColumns($target);

        // FK order becomes irrelevant with replica mode; triggers stay quiet.
        DB::connection($target)->statement('SET session_replication_role = replica');

        try {
            foreach ($tables as $table) {
                $this->copyTable($source, $target, $table, $booleanColumns[$table] ?? []);
            }
        } finally {
            DB::connection($target)->statement('SET session_replication_role = origin');
        }

        $this->resyncSequences($target);
        $this->verify($source, $target, $tables);

        return self::SUCCESS;
    }

    /** @return list<string> */
    private function resolveTables(string $source, string $target): array
    {
        $sourceTables = array_map(
            static fn (array $t): string => (string) $t['name'],
            DB::connection($source)->getSchemaBuilder()->getTables(),
        );
        $targetTables = array_map(
            static fn (array $t): string => (string) $t['name'],
            DB::connection($target)->getSchemaBuilder()->getTables(),
        );

        $tables = array_values(array_diff(
            array_intersect($sourceTables, $targetTables),
            self::SKIP,
        ));

        $only = (string) $this->option('tables');
        if ($only !== '') {
            $subset = array_map('trim', explode(',', $only));
            $tables = array_values(array_intersect($tables, $subset));
        }

        sort($tables);

        return $tables;
    }

    /** @param list<string> $boolCols */
    private function copyTable(string $source, string $target, string $table, array $boolCols): void
    {
        if ($this->option('truncate')) {
            DB::connection($target)->statement("TRUNCATE TABLE {$table} CASCADE");
        }

        $total = 0;
        $buffer = [];

        foreach (DB::connection($source)->table($table)->cursor() as $row) {
            $row = (array) $row;
            foreach ($boolCols as $col) {
                if (array_key_exists($col, $row) && $row[$col] !== null) {
                    $row[$col] = (bool) $row[$col];
                }
            }
            $buffer[] = $row;

            if (count($buffer) >= 500) {
                DB::connection($target)->table($table)->insert($buffer);
                $total += count($buffer);
                $buffer = [];
            }
        }

        if ($buffer !== []) {
            DB::connection($target)->table($table)->insert($buffer);
            $total += count($buffer);
        }

        $this->line(sprintf('  %-40s %8d rows copied', $table, $total));
    }

    /**
     * Map of table => boolean column names on the target schema.
     *
     * @return array<string, list<string>>
     */
    private function booleanColumns(string $target): array
    {
        $rows = DB::connection($target)->select(
            "SELECT table_name, column_name
             FROM information_schema.columns
             WHERE table_schema = current_schema() AND data_type = 'boolean'",
        );

        $map = [];
        foreach ($rows as $row) {
            $map[$row->table_name][] = $row->column_name;
        }

        return $map;
    }

    /** Re-sync every identity/serial sequence to MAX(column). */
    private function resyncSequences(string $target): void
    {
        $sequences = DB::connection($target)->select(
            "SELECT table_name, column_name
             FROM information_schema.columns
             WHERE table_schema = current_schema()
               AND (is_identity = 'YES' OR column_default LIKE 'nextval(%')",
        );

        foreach ($sequences as $seq) {
            DB::connection($target)->statement(sprintf(
                "SELECT setval(
                    pg_get_serial_sequence('%s', '%s'),
                    GREATEST((SELECT COALESCE(MAX(%s), 0) FROM %s), 1)
                )",
                $seq->table_name,
                $seq->column_name,
                $seq->column_name,
                $seq->table_name,
            ));
        }

        $this->line(sprintf('  %d sequences re-synced', count($sequences)));
    }

    /** @param list<string> $tables */
    private function verify(string $source, string $target, array $tables): void
    {
        $mismatches = 0;
        foreach ($tables as $table) {
            $s = DB::connection($source)->table($table)->count();
            $t = DB::connection($target)->table($table)->count();
            if ($s !== $t) {
                $mismatches++;
                $this->warn(sprintf('  MISMATCH %-32s source=%d target=%d', $table, $s, $t));
            }
        }

        $mismatches === 0
            ? $this->info('Row counts verified — source and target match on every table.')
            : $this->error("{$mismatches} tables mismatched — investigate before switching traffic.");
    }
}
