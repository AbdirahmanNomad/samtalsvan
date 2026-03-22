#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_HOST="${PGHOST:-db}"
DB_USER="${PGUSER:-samtalsvan}"
DB_NAME="${PGDATABASE:-samtalsvan}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/samtalsvan_${TIMESTAMP}.sql.gz"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
  exit 1
}

if [ ! -d "$BACKUP_DIR" ]; then
  mkdir -p "$BACKUP_DIR" || error "Failed to create backup directory"
fi

log "Starting backup of database: $DB_NAME"

if ! pg_isready -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
  error "Database is not ready"
fi

pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip > "$BACKUP_FILE" || error "Backup failed"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup completed: $BACKUP_FILE ($SIZE)"

log "Uploading to S3..."
if [ -n "${BACKUP_S3_BUCKET:-}" ] && [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
  aws s3 cp "$BACKUP_FILE" \
    "s3://${BACKUP_S3_BUCKET}/backups/samtalsvan_${TIMESTAMP}.sql.gz" \
    --region "${BACKUP_S3_REGION:-eu-north-1}" \
    --storage-class STANDARD_IA || log "Warning: S3 upload failed"
  log "S3 upload completed"
else
  log "S3 upload skipped (not configured)"
fi

log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "samtalsvan_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
log "Cleanup completed"

if [ -n "${BACKUP_S3_BUCKET:-}" ] && [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
  log "Cleaning up old S3 backups..."
  aws s3 ls "s3://${BACKUP_S3_BUCKET}/backups/" \
    | awk '{print $4}' \
    | grep "^samtalsvan_.*\.sql\.gz$" \
    | while read -r file; do
        file_date=$(echo "$file" | sed 's/samtalsvan_\([0-9_]*\)\.sql\.gz/\1/' | cut -d_ -f1)
        file_timestamp=$(date -d "$file_date" +%s 2>/dev/null || echo 0)
        cutoff_timestamp=$(date -d "-$RETENTION_DAYS days" +%s)
        if [ "$file_timestamp" -lt "$cutoff_timestamp" ] && [ "$file_timestamp" -gt 0 ]; then
          aws s3 rm "s3://${BACKUP_S3_BUCKET}/backups/$file" || true
        fi
      done
  log "S3 cleanup completed"
fi

log "Backup process finished successfully"
