#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_HOST="${PGHOST:-db}"
DB_USER="${PGUSER:-samtalsvan}"
DB_NAME="${PGDATABASE:-samtalsvan}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
  exit 1
}

usage() {
  cat << EOF
Usage: $0 [OPTIONS] [BACKUP_FILE]

Options:
  -l, --list        List available backups
  -f, --file FILE   Restore from specific file
  -s, --s3 KEY      Download and restore from S3
  -y, --yes         Skip confirmation prompt
  -h, --help        Show this help message

Examples:
  $0 --list
  $0 /backups/samtalsvan_20240101_120000.sql.gz
  $0 --s3 backups/samtalsvan_20240101_120000.sql.gz
  $0 -y /backups/latest.sql.gz
EOF
}

list_backups() {
  log "Available local backups:"
  if [ -d "$BACKUP_DIR" ]; then
    ls -lh "$BACKUP_DIR"/samtalsvan_*.sql.gz 2>/dev/null || log "No local backups found"
  else
    log "Backup directory does not exist: $BACKUP_DIR"
  fi
  
  if [ -n "${BACKUP_S3_BUCKET:-}" ] && [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
    log ""
    log "Available backups in S3:"
    aws s3 ls "s3://${BACKUP_S3_BUCKET}/backups/" || log "No S3 backups found"
  fi
}

download_from_s3() {
  local s3_key="$1"
  local local_file="${BACKUP_DIR}/$(basename "$s3_key")"
  
  mkdir -p "$BACKUP_DIR"
  log "Downloading from S3: $s3_key"
  aws s3 cp "s3://${BACKUP_S3_BUCKET}/${s3_key}" "$local_file" \
    --region "${BACKUP_S3_REGION:-eu-north-1}" || error "S3 download failed"
  
  echo "$local_file"
}

restore_backup() {
  local backup_file="$1"
  
  if [ ! -f "$backup_file" ]; then
    error "Backup file not found: $backup_file"
  fi
  
  log "WARNING: This will REPLACE all data in the database!"
  log "Backup file: $backup_file"
  
  if [ "${AUTO_CONFIRM:-false}" != "true" ]; then
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      log "Restore cancelled"
      exit 0
    fi
  fi
  
  log "Dropping existing database connections..."
  psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
    2>/dev/null || log "Warning: Could not terminate connections"
  
  log "Dropping and recreating database..."
  psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
  psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
  
  log "Restoring backup..."
  zcat "$backup_file" | psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 || error "Restore failed"
  
  log "Restore completed successfully!"
  log "Database: $DB_NAME"
  log "Backup: $backup_file"
}

AUTO_CONFIRM="false"
BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    -l|--list)
      list_backups
      exit 0
      ;;
    -f|--file)
      BACKUP_FILE="$2"
      shift 2
      ;;
    -s|--s3)
      if [ -z "${BACKUP_S3_BUCKET:-}" ] || [ -z "${AWS_ACCESS_KEY_ID:-}" ]; then
        error "S3 not configured. Set BACKUP_S3_BUCKET and AWS credentials."
      fi
      BACKUP_FILE=$(download_from_s3 "$2")
      shift 2
      ;;
    -y|--yes)
      AUTO_CONFIRM="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      BACKUP_FILE="$1"
      shift
      ;;
  esac
done

if [ -z "$BACKUP_FILE" ]; then
  log "No backup file specified. Showing available backups:"
  list_backups
  echo ""
  read -p "Enter backup file to restore: " BACKUP_FILE
fi

restore_backup "$BACKUP_FILE"
