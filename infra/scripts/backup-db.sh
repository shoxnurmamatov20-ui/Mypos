#!/usr/bin/env bash
# MyPOS — MySQL backup script (ADR-0005, 2026-05-10 — was pg_dump)
# Usage: ./backup-db.sh [destination_prefix]
#
# Runs via cron in production (daily, 3 AM UZ):
#   0 3 * * * /opt/mypos/infra/scripts/backup-db.sh
#
# Requires env vars (set in production):
#   DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
#   MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET
#   R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET (optional, for offsite)
#   BACKUP_GPG_RECIPIENT (for encryption)

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PREFIX="${1:-daily}"
FILENAME="mypos_${PREFIX}_${TIMESTAMP}.sql.gz"
TMPDIR=$(mktemp -d)
OUTPUT="${TMPDIR}/${FILENAME}"

echo "[$(date)] Starting backup: ${FILENAME}"

# Dump + gzip. --single-transaction gives a consistent snapshot on InnoDB
# without locking other writes; --routines/--triggers/--events preserve
# stored programs; --set-gtid-purged=OFF avoids GTID pollution on replica
# restore; --no-tablespaces avoids the InnoDB tablespace permission warning
# that otherwise breaks the script under set -e.
mysqldump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USERNAME}" \
    --password="${DB_PASSWORD}" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    --set-gtid-purged=OFF \
    --no-tablespaces \
    --default-character-set=utf8mb4 \
    "${DB_DATABASE}" \
    | gzip -9 > "${OUTPUT}"

echo "[$(date)] Dump size: $(du -h "${OUTPUT}" | cut -f1)"

# Optional: encrypt with GPG
if [ -n "${BACKUP_GPG_RECIPIENT:-}" ]; then
    echo "[$(date)] Encrypting with GPG..."
    gpg --batch --yes --encrypt \
        --recipient "${BACKUP_GPG_RECIPIENT}" \
        --output "${OUTPUT}.gpg" \
        "${OUTPUT}"
    rm "${OUTPUT}"
    OUTPUT="${OUTPUT}.gpg"
    FILENAME="${FILENAME}.gpg"
fi

# Upload to MinIO (UZ primary)
echo "[$(date)] Uploading to MinIO..."
mc alias set primary "${MINIO_ENDPOINT}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}"
mc cp "${OUTPUT}" "primary/${MINIO_BUCKET}/backups/${FILENAME}"

# Upload to R2 (offsite, optional)
if [ -n "${R2_ACCESS_KEY:-}" ]; then
    echo "[$(date)] Uploading to Cloudflare R2..."
    mc alias set r2 "${R2_ENDPOINT}" "${R2_ACCESS_KEY}" "${R2_SECRET_KEY}"
    mc cp "${OUTPUT}" "r2/${R2_BUCKET}/backups/${FILENAME}"
fi

# Cleanup
rm -rf "${TMPDIR}"

# Retention: keep daily 30d, weekly 90d, monthly forever
if [ "${PREFIX}" = "daily" ]; then
    echo "[$(date)] Pruning daily backups older than 30 days..."
    mc find "primary/${MINIO_BUCKET}/backups/" \
        --name "mypos_daily_*" \
        --older-than 30d \
        --exec "mc rm {}"
fi

echo "[$(date)] Backup complete: ${FILENAME}"
