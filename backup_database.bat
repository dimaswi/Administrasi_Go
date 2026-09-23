@echo off
set PGPASSWORD=Dimasw1950

echo Membackup struktur database (schema) ke backend/schema.sql...
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -s administrasi > backend\schema.sql

echo Membackup seluruh data (untuk pindah PC) ke backend/migration_backup.sql...
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres -h localhost -p 5432 administrasi > backend\migration_backup.sql

echo Backup selesai!
pause
