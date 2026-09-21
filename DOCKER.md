# 🐳 Docker Setup — Administrasi Go

Panduan menjalankan sistem menggunakan Docker.

---

## 📁 Struktur File Docker

```
Administrasi_Go/
├── docker-compose.yml          ← Production
├── docker-compose.dev.yml      ← Development (hot reload)
├── .env.example                ← Template environment variables
├── Makefile                    ← Shortcut commands
│
├── backend/
│   ├── Dockerfile              ← Multi-stage build Go
│   ├── .air.toml               ← Hot reload config (Air)
│   └── .dockerignore
│
├── frontend/
│   ├── Dockerfile              ← Multi-stage build Vite + Nginx
│   ├── docker/
│   │   └── nginx.conf          ← Nginx config untuk SPA
│   └── .dockerignore
│
└── docker/
    └── postgres/
        ├── Dockerfile
        ├── restore.sh
        └── dump.sql            ← ⚠️ Isi manual (lihat langkah 2)
```

---

## 🚀 Cara Menjalankan

### Langkah 1 — Persiapan

```bash
# Copy template .env
cp .env.example .env

# Edit .env dan isi nilai yang diperlukan
# Minimal: POSTGRES_PASSWORD dan JWT_SECRET
```

### Langkah 2 — Siapkan Dump Database

> **Format dump**: File `dump-administrasi-*.sql` di root adalah format **pg_dump custom** (binary), bukan SQL plain text. Gunakan `pg_restore` untuk restore-nya.

```bash
# Copy dump file ke lokasi yang dikenali Docker
copy dump-administrasi-202609190819.sql docker\postgres\dump.sql
```

### Langkah 3 — Jalankan

#### Mode Development (Hot Reload) 🔥
```bash
# Backend Go akan auto-rebuild saat ada perubahan .go
# Frontend Vite dev server dengan HMR

docker compose -f docker-compose.dev.yml up --build
```

Akses:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080

#### Mode Production 🏭
```bash
docker compose up -d --build
```

Akses:
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8080

---

## ⚙️ Environment Variables

| Variable | Wajib | Default | Keterangan |
|----------|-------|---------|------------|
| `POSTGRES_DB` | ✅ | `administrasi` | Nama database |
| `POSTGRES_USER` | ✅ | `postgres` | User PostgreSQL |
| `POSTGRES_PASSWORD` | ✅ | — | Password PostgreSQL |
| `JWT_SECRET` | ✅ | — | Secret key JWT (min. 32 karakter) |
| `VITE_API_URL` | — | `http://localhost:8080` | URL API untuk frontend |

---

## 🗄️ Database

### Restore ulang database
Jika ingin restore ulang dari dump:

```bash
# Hapus flag restore, lalu jalankan ulang service db-restore
docker volume rm administrasi_db_restored_flag
docker compose up -d db-restore
```

### Buat dump baru
```bash
docker exec administrasi_postgres pg_dump -U postgres -Fc administrasi > docker/postgres/dump-baru.sql
```

### Buka psql shell
```bash
docker exec -it administrasi_postgres psql -U postgres -d administrasi
```

---

## 🛠️ Troubleshooting

### Backend tidak bisa connect ke PostgreSQL
Pastikan `DB_HOST=postgres` (nama service, bukan `localhost`) di `.env`.

### Dump tidak ter-restore
- Cek apakah file ada: `docker/postgres/dump.sql`
- Cek log: `docker compose logs db-restore`
- Pastikan format file adalah pg_dump custom (bukan plain SQL)

### Frontend tidak bisa hit API
- Cek `VITE_API_URL` di `.env` sudah mengarah ke backend yang benar
- Untuk production, API dan frontend di server yang sama → set `VITE_API_URL` ke domain/IP server

### Hot reload tidak bekerja (dev mode)
- Cek volume mount di `docker-compose.dev.yml`
- Pastikan Air (`air`) sudah terinstall di container: `docker exec administrasi_backend_dev which air`

---

## 📋 Perintah Berguna

```bash
# Lihat semua container yang berjalan
docker compose ps

# Lihat logs real-time
docker compose logs -f

# Masuk ke shell backend
docker exec -it administrasi_backend sh

# Masuk ke shell frontend
docker exec -it administrasi_frontend sh

# Stop semua
docker compose down

# Stop dan hapus semua data (HATI-HATI!)
docker compose down -v
```
