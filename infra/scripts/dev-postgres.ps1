# MyPOS — local PostgreSQL 18 dev cluster (Windows, ADR-0006)
#
# Creates and starts a self-contained, trust-auth PostgreSQL cluster on port
# 5433 so local development never depends on the system-wide PostgreSQL
# service (or its password). Safe to re-run — every step is idempotent.
#
#   powershell -ExecutionPolicy Bypass -File infra/scripts/dev-postgres.ps1
#   powershell -File infra/scripts/dev-postgres.ps1 -Stop     # stop it again
#
# Trust auth is DEV-ONLY: the cluster listens on 127.0.0.1 exclusively.

param(
    [int]$Port = 5433,
    [string]$DataDir = "$env:USERPROFILE\.mypos\pg18-data",
    [switch]$Stop
)

$ErrorActionPreference = 'Stop'

# Locate the newest installed PostgreSQL toolchain (18 preferred).
$pgBin = $null
foreach ($v in @('18', '17', '16')) {
    $candidate = "C:\Program Files\PostgreSQL\$v\bin"
    if (Test-Path "$candidate\pg_ctl.exe") { $pgBin = $candidate; break }
}
if ($null -eq $pgBin) {
    Write-Error 'PostgreSQL is not installed. Get it from https://www.postgresql.org/download/windows/'
}

if ($Stop) {
    & "$pgBin\pg_ctl.exe" -D $DataDir stop -m fast
    exit $LASTEXITCODE
}

# 1) Init the cluster once.
if (-not (Test-Path "$DataDir\PG_VERSION")) {
    New-Item -ItemType Directory -Force (Split-Path $DataDir) | Out-Null
    & "$pgBin\initdb.exe" -D $DataDir -U postgres -A trust -E UTF8 --locale=C
    Add-Content "$DataDir\postgresql.conf" @"

# --- MyPOS dev overrides (infra/scripts/dev-postgres.ps1) ---
port = $Port
listen_addresses = '127.0.0.1'
shared_buffers = 256MB
synchronous_commit = off
max_wal_size = 2GB
logging_collector = off
"@
}

# 2) Start it (no-op if already running).
$running = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $running) {
    & "$pgBin\pg_ctl.exe" -D $DataDir -l "$DataDir\pg.log" -w -t 30 start
}

# 3) Ensure databases exist.
foreach ($db in @('mypos', 'mypos_test')) {
    $exists = & "$pgBin\psql.exe" -h 127.0.0.1 -p $Port -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$db'"
    if ($exists -ne '1') {
        & "$pgBin\createdb.exe" -h 127.0.0.1 -p $Port -U postgres $db
        Write-Host "created database $db"
    }
}

Write-Host "PostgreSQL dev cluster ready on 127.0.0.1:$Port (user postgres, trust auth)."
Write-Host "apps/api/.env: DB_CONNECTION=pgsql DB_HOST=127.0.0.1 DB_PORT=$Port DB_DATABASE=mypos DB_USERNAME=postgres DB_PASSWORD="
