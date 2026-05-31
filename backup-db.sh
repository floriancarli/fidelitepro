#!/usr/bin/env bash
# Exporte la base Supabase en SQL via pg_dump et archive dans /backups/
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
# Charge DATABASE_URL depuis .env.local si disponible, sinon depuis l'environnement
ENV_FILE="$(dirname "$0")/.env.local"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  export $(grep -v '^#' "$ENV_FILE" | grep 'DATABASE_URL' | xargs)
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Erreur : DATABASE_URL non définie (dans .env.local ou l'environnement)." >&2
  exit 1
fi

# ── Destination ──────────────────────────────────────────────────────────────
BACKUP_DIR="$(dirname "$0")/backups"
mkdir -p "$BACKUP_DIR"

FILENAME="backup_$(date +%Y-%m-%d_%H-%M-%S).sql"
OUTPUT="$BACKUP_DIR/$FILENAME"

# ── Dump ─────────────────────────────────────────────────────────────────────
echo "Démarrage du backup → $OUTPUT"
pg_dump \
  --no-owner \
  --no-acl \
  --schema=public \
  "$DATABASE_URL" \
  > "$OUTPUT"

echo "Backup terminé : $OUTPUT ($(du -sh "$OUTPUT" | cut -f1))"
