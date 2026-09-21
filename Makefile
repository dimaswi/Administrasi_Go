# ============================================================
# Makefile — Shortcut commands untuk development & deployment
# Gunakan: make <target>
# ============================================================

.PHONY: help setup dev dev-down prod prod-down db-restore db-shell \
        backend-shell frontend-shell logs clean reset

# Warna output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
RESET  := \033[0m

help: ## Tampilkan daftar perintah
	@echo ""
	@echo "$(CYAN)╔══════════════════════════════════════════╗$(RESET)"
	@echo "$(CYAN)║      Administrasi Go — Make Commands     ║$(RESET)"
	@echo "$(CYAN)╚══════════════════════════════════════════╝$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ─────────────────────────────────────────
# Setup
# ─────────────────────────────────────────
setup: ## Setup awal: copy .env, copy dump file
	@echo "$(YELLOW)⚙️  Setup awal...$(RESET)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)✅ .env berhasil dibuat dari .env.example$(RESET)"; \
		echo "$(YELLOW)⚠️  Jangan lupa isi nilai di .env!$(RESET)"; \
	else \
		echo "ℹ️  .env sudah ada, skip."; \
	fi
	@if [ ! -f docker/postgres/dump.sql ]; then \
		DUMP_FILE=$$(ls dump-administrasi-*.sql 2>/dev/null | head -1); \
		if [ -n "$$DUMP_FILE" ]; then \
			cp "$$DUMP_FILE" docker/postgres/dump.sql; \
			echo "$(GREEN)✅ Dump file disalin ke docker/postgres/dump.sql$(RESET)"; \
		else \
			echo "$(YELLOW)⚠️  Tidak ada dump file ditemukan. Letakkan manual ke docker/postgres/dump.sql$(RESET)"; \
		fi \
	else \
		echo "ℹ️  dump.sql sudah ada, skip."; \
	fi

# ─────────────────────────────────────────
# Development
# ─────────────────────────────────────────
dev: ## Jalankan semua service dalam mode development (hot reload)
	@echo "$(CYAN)🚀 Menjalankan mode development...$(RESET)"
	docker compose -f docker-compose.dev.yml up --build

dev-down: ## Stop semua service development
	docker compose -f docker-compose.dev.yml down

dev-logs: ## Lihat logs semua service dev
	docker compose -f docker-compose.dev.yml logs -f

# ─────────────────────────────────────────
# Production
# ─────────────────────────────────────────
prod: ## Build dan jalankan semua service production
	@echo "$(CYAN)🏭 Menjalankan mode production...$(RESET)"
	docker compose up -d --build

prod-down: ## Stop semua service production
	docker compose down

prod-logs: ## Lihat logs semua service production
	docker compose logs -f

# ─────────────────────────────────────────
# Database
# ─────────────────────────────────────────
db-restore: ## Restore database dari dump (reset flag agar restore ulang)
	@echo "$(YELLOW)🗄️  Reset flag restore dan jalankan ulang...$(RESET)"
	docker volume rm -f administrasi_db_restored_flag 2>/dev/null || true
	docker volume rm -f administrasi_db_restored_dev_flag 2>/dev/null || true
	docker compose up -d db-restore

db-shell: ## Buka shell PostgreSQL
	docker exec -it administrasi_postgres psql -U postgres -d administrasi

db-shell-dev: ## Buka shell PostgreSQL (dev)
	docker exec -it administrasi_postgres_dev psql -U postgres -d administrasi

db-dump: ## Buat dump baru dari container yang sedang berjalan
	@echo "$(CYAN)📦 Membuat dump database...$(RESET)"
	docker exec administrasi_postgres \
		pg_dump -U postgres -Fc administrasi \
		> docker/postgres/dump-$$(date +%Y%m%d%H%M).sql
	@echo "$(GREEN)✅ Dump tersimpan di docker/postgres/$(RESET)"

# ─────────────────────────────────────────
# Shell Access
# ─────────────────────────────────────────
backend-shell: ## Buka shell di container backend
	docker exec -it administrasi_backend sh

frontend-shell: ## Buka shell di container frontend
	docker exec -it administrasi_frontend sh

# ─────────────────────────────────────────
# Maintenance
# ─────────────────────────────────────────
logs: ## Lihat logs semua service (production)
	docker compose logs -f

clean: ## Stop semua container dan hapus orphan containers
	docker compose down --remove-orphans
	docker compose -f docker-compose.dev.yml down --remove-orphans

reset: ## ⚠️  DANGER: Hapus semua data (volumes, containers, images)
	@echo "$(YELLOW)⚠️  PERINGATAN: Ini akan menghapus SEMUA data termasuk database!$(RESET)"
	@read -p "Ketik 'yes' untuk konfirmasi: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		docker compose down -v --rmi local --remove-orphans; \
		docker compose -f docker-compose.dev.yml down -v --rmi local --remove-orphans; \
		echo "$(GREEN)✅ Reset selesai.$(RESET)"; \
	else \
		echo "Dibatalkan."; \
	fi
