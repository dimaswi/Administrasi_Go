#!/bin/sh
# ============================================================
# Docker entrypoint untuk database PostgreSQL
# Menjalankan restore dari dump file pg_dump (custom format)
# ============================================================

set -e

echo "⏳ Menunggu PostgreSQL siap..."
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
    sleep 1
done

echo "✅ PostgreSQL siap."

DUMP_FILE="/docker-entrypoint-initdb.d/dump.sql"
FLAG_FILE="/var/lib/postgresql/data/.db_restored"

# Cek apakah dump sudah pernah di-restore
if [ ! -f "$FLAG_FILE" ]; then
    if [ -f "$DUMP_FILE" ]; then
        echo "📦 Ditemukan dump file, memulai restore..."
        pg_restore \
            --username="$POSTGRES_USER" \
            --dbname="$POSTGRES_DB" \
            --no-owner \
            --no-privileges \
            --verbose \
            "$DUMP_FILE" || echo "⚠️ Restore selesai dengan beberapa warning (normal jika DB sudah punya data)"
        touch "$FLAG_FILE"
        echo "✅ Database berhasil di-restore."
    else
        echo "ℹ️ Tidak ada dump file, database dimulai kosong."
    fi
else
    echo "ℹ️ Database sudah pernah di-restore, skip."
fi
