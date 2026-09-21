FROM postgres:17-alpine

# Install tools tambahan (pg_restore sudah built-in)
RUN apk add --no-cache bash

# Script restore diletakkan di /docker-entrypoint-initdb.d/
# tapi karena dump kita adalah custom format (.dump), kita pakai entrypoint sendiri
COPY restore.sh /usr/local/bin/restore.sh
RUN chmod +x /usr/local/bin/restore.sh
