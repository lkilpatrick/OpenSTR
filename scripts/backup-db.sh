#!/usr/bin/env bash
# Daily PostgreSQL backup — keeps 7 days of dumps.
# Recommended cron: 0 3 * * * /tank/developer/openstr/scripts/backup-db.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.production"

# Load env vars
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
KEEP_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="openstr_${TIMESTAMP}.pgdump"

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting dump → $BACKUP_DIR/$FILENAME"

docker compose -f "$PROJECT_DIR/docker-compose.prod.yml" \
  --env-file "$ENV_FILE" \
  exec -T postgres \
  pg_dump \
    --username="$POSTGRES_USER" \
    --format=custom \
    --no-password \
    "$POSTGRES_DB" \
  > "$BACKUP_DIR/$FILENAME"

echo "[backup] Dump complete ($(du -h "$BACKUP_DIR/$FILENAME" | cut -f1))"

# Remove backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "openstr_*.pgdump" -mtime "+$KEEP_DAYS" -delete
echo "[backup] Pruned backups older than $KEEP_DAYS days"

BACKUP_COUNT=$(find "$BACKUP_DIR" -name "openstr_*.pgdump" | wc -l)
echo "[backup] $BACKUP_COUNT backup(s) retained in $BACKUP_DIR"
