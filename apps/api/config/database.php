<?php

use Illuminate\Support\Str;
use Pdo\Mysql;
use Pdo\Pgsql;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the database connections below you wish
    | to use as your default connection for database operations. This is
    | the connection which will be utilized unless another connection
    | is explicitly specified when you execute a query / statement.
    |
    */

    // Default 'pgsql' — ADR-0006 (2026-07-02) moved the primary DB back to
    // PostgreSQL (18.x), reversing ADR-0005. Postgres gives us RLS
    // defense-in-depth for tenant isolation, declarative partitioning for
    // hot telemetry tables, partial/covering indexes, and JSONB. The
    // sqlite fallback stays out: in production it would silently route
    // writes to a local file and lose them.
    'default' => env('DB_CONNECTION', 'pgsql'),

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    |
    | Below are all of the database connections defined for your application.
    | An example configuration is provided for each database system which
    | is supported by Laravel. You're free to add / remove connections.
    |
    */

    'connections' => [

        'sqlite' => [
            'driver' => 'sqlite',
            'url' => env('DB_URL'),
            'database' => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix' => '',
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
            'busy_timeout' => null,
            'journal_mode' => null,
            'synchronous' => null,
            'transaction_mode' => 'DEFERRED',
        ],

        // Legacy connection (primary until ADR-0006). Retained as the source
        // side of the one-off MySQL→PostgreSQL data migration bridge
        // (`php artisan db:migrate-from-mysql`) and for reading old backups.
        // Deliberately pinned to its own LEGACY_DB_* env vars so the primary
        // DB_* vars (now Postgres) can never accidentally point Eloquent at
        // the old database.
        'mysql' => [
            'driver' => 'mysql',
            'url' => env('LEGACY_DB_URL'),
            'host' => env('LEGACY_DB_HOST', '127.0.0.1'),
            'port' => env('LEGACY_DB_PORT', '3306'),
            'database' => env('LEGACY_DB_DATABASE', 'mypos'),
            'username' => env('LEGACY_DB_USERNAME', 'root'),
            'password' => env('LEGACY_DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => env('DB_CHARSET', 'utf8mb4'),
            'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
            'prefix' => '',
            'prefix_indexes' => true,
            // STRICT_ALL_TABLES on — silent truncation/coercion is unacceptable
            // for a multi-tenant POS where decimal price drift = revenue drift.
            'strict' => true,
            // Force InnoDB so foreign keys and transactions actually work
            // (XAMPP defaults are sane but not guaranteed across hosts).
            'engine' => 'InnoDB',
            // ADR-0005 follow-up: explicit PDO options for production safety.
            //   - emulate_prepares=false → real server-side prepared statements,
            //     correct param binding, defence against rare injection vectors.
            //   - errmode=exception        → fail loudly on driver errors.
            //   - default_fetch_mode=assoc → predictable result shape.
            //   - persistent (opt-in)      → reuse PHP-FPM connections; defaults
            //     off because XAMPP/dev does not need it.
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_PERSISTENT => env('DB_PERSISTENT', false),
                (PHP_VERSION_ID >= 80500 ? Mysql::ATTR_SSL_CA : PDO::MYSQL_ATTR_SSL_CA) => env('MYSQL_ATTR_SSL_CA'),
            ], static fn ($v) => $v !== null) : [],
        ],

        'mariadb' => [
            'driver' => 'mariadb',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => env('DB_CHARSET', 'utf8mb4'),
            'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                (PHP_VERSION_ID >= 80500 ? Mysql::ATTR_SSL_CA : PDO::MYSQL_ATTR_SSL_CA) => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        // Primary connection since ADR-0006 (2026-07-02).
        'pgsql' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '5432'),
            'database' => env('DB_DATABASE', 'mypos'),
            'username' => env('DB_USERNAME', 'postgres'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            // verify-full in production — set via DB_SSLMODE (Doppler/Coolify).
            'sslmode' => env('DB_SSLMODE', 'prefer'),
            // Shows up in pg_stat_activity / pg_stat_statements — makes
            // per-service connection debugging possible on shared clusters.
            'application_name' => env('DB_APPLICATION_NAME', 'mypos-api'),
            'options' => extension_loaded('pdo_pgsql') ? array_filter([
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                // Opt-in for PHP-FPM/Octane connection reuse (off in dev).
                PDO::ATTR_PERSISTENT => env('DB_PERSISTENT', false),
                // Set DB_DISABLE_PREPARES=true when connecting through
                // PgBouncer in transaction-pooling mode — named prepared
                // statements are per-session and break behind such poolers.
                (PHP_VERSION_ID >= 80500 ? Pgsql::ATTR_DISABLE_PREPARES : PDO::PGSQL_ATTR_DISABLE_PREPARES) => env('DB_DISABLE_PREPARES', false) ? true : null,
            ], static fn ($v) => $v !== null && $v !== false) : [],
        ],

        'sqlsrv' => [
            'driver' => 'sqlsrv',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', 'localhost'),
            'port' => env('DB_PORT', '1433'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            // 'encrypt' => env('DB_ENCRYPT', 'yes'),
            // 'trust_server_certificate' => env('DB_TRUST_SERVER_CERTIFICATE', 'false'),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Web-runtime role split (ADR-0006 "Runtime roles")
    |--------------------------------------------------------------------------
    |
    | PostgreSQL table owners bypass Row-Level Security, so the HTTP runtime
    | must NOT connect as the migrator/owner role (`mypos`). When these are
    | set, `AppServiceProvider` swaps the pgsql connection credentials to
    | this login-enabled, NOBYPASSRLS role for PHP-FPM requests only —
    | artisan (migrations), Horizon workers, the scheduler and Reverb stay
    | on the owner role, exactly as infra/scripts/pg-app-role.sql documents.
    |
    */

    'app_runtime' => [
        'username' => env('DB_APP_USERNAME'),
        'password' => env('DB_APP_PASSWORD', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Migration Repository Table
    |--------------------------------------------------------------------------
    |
    | This table keeps track of all the migrations that have already run for
    | your application. Using this information, we can determine which of
    | the migrations on disk haven't actually been run on the database.
    |
    */

    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Redis Databases
    |--------------------------------------------------------------------------
    |
    | Redis is an open source, fast, and advanced key-value store that also
    | provides a richer body of commands than a typical key-value system
    | such as Memcached. You may define your connection settings here.
    |
    */

    'redis' => [

        'client' => env('REDIS_CLIENT', 'phpredis'),

        'options' => [
            'cluster' => env('REDIS_CLUSTER', 'redis'),
            'prefix' => env('REDIS_PREFIX', Str::slug((string) env('APP_NAME', 'laravel')).'-database-'),
            'persistent' => env('REDIS_PERSISTENT', false),
        ],

        'default' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_DB', '0'),
            'max_retries' => env('REDIS_MAX_RETRIES', 3),
            'backoff_algorithm' => env('REDIS_BACKOFF_ALGORITHM', 'decorrelated_jitter'),
            'backoff_base' => env('REDIS_BACKOFF_BASE', 100),
            'backoff_cap' => env('REDIS_BACKOFF_CAP', 1000),
        ],

        'cache' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_CACHE_DB', '1'),
            'max_retries' => env('REDIS_MAX_RETRIES', 3),
            'backoff_algorithm' => env('REDIS_BACKOFF_ALGORITHM', 'decorrelated_jitter'),
            'backoff_base' => env('REDIS_BACKOFF_BASE', 100),
            'backoff_cap' => env('REDIS_BACKOFF_CAP', 1000),
        ],

    ],

];
