package config

import (
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

type DBConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

func ConnectDB(cfg DBConfig) *sqlx.DB {
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode)

	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatalln("Failed to connect to database:", err)
	}

	// Auto Migrate Work Locations Table
	initSchema := `
	CREATE TABLE IF NOT EXISTS work_locations (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		latitude DOUBLE PRECISION NOT NULL,
		longitude DOUBLE PRECISION NOT NULL,
		radius INT NOT NULL DEFAULT 100,
		address TEXT,
		is_active BOOLEAN NOT NULL DEFAULT TRUE,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		deleted_at TIMESTAMP NULL
	);

	INSERT INTO work_locations (name, latitude, longitude, radius, address, is_active)
	SELECT 'Kantor Utama Jakarta', -6.200000, 106.816666, 100, 'Jl. Jend. Sudirman No. 1, Jakarta', true
	WHERE NOT EXISTS (SELECT 1 FROM work_locations WHERE deleted_at IS NULL);

	INSERT INTO leave_types (code, name, description, default_quota, is_paid, requires_approval, allow_carry_over, max_carry_over_days, min_advance_days, max_consecutive_days, is_active, sort_order, color, created_at, updated_at)
	SELECT 'CT', 'Cuti Tahunan', 'Cuti tahunan reguler pegawai', 12, true, true, true, 6, 3, 12, true, 1, 'green', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
	WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'CT');

	INSERT INTO leave_types (code, name, description, default_quota, is_paid, requires_approval, allow_carry_over, max_carry_over_days, min_advance_days, max_consecutive_days, is_active, sort_order, color, created_at, updated_at)
	SELECT 'CS', 'Izin Sakit', 'Izin ketidakhadiran karena kondisi medis/sakit', 0, true, true, false, 0, 0, 14, true, 2, 'blue', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
	WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'CS');

	INSERT INTO leave_types (code, name, description, default_quota, is_paid, requires_approval, allow_carry_over, max_carry_over_days, min_advance_days, max_consecutive_days, is_active, sort_order, color, created_at, updated_at)
	SELECT 'IK', 'Izin Khusus / Alasan Penting', 'Izin untuk keperluan mendesak atau keluarga', 3, true, true, false, 0, 1, 3, true, 3, 'purple', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
	WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'IK');

	INSERT INTO leave_types (code, name, description, default_quota, is_paid, requires_approval, allow_carry_over, max_carry_over_days, min_advance_days, max_consecutive_days, is_active, sort_order, color, created_at, updated_at)
	SELECT 'CM', 'Cuti Melahirkan', 'Cuti melahirkan bagi karyawati', 90, true, true, false, 0, 30, 90, true, 4, 'pink', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
	WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'CM');

	INSERT INTO leave_types (code, name, description, default_quota, is_paid, requires_approval, allow_carry_over, max_carry_over_days, min_advance_days, max_consecutive_days, is_active, sort_order, color, created_at, updated_at)
	SELECT 'CN', 'Cuti Menikah', 'Cuti pernikahan karyawan', 3, true, true, false, 0, 7, 3, true, 5, 'cyan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
	WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'CN');

	INSERT INTO leave_types (code, name, description, default_quota, is_paid, requires_approval, allow_carry_over, max_carry_over_days, min_advance_days, max_consecutive_days, is_active, sort_order, color, created_at, updated_at)
	SELECT 'CB', 'Cuti Bersama', 'Cuti bersama ketetapan pemerintah', 0, true, true, false, 0, 1, 5, true, 6, 'yellow', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
	WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'CB');

	INSERT INTO leave_types (code, name, description, default_quota, is_paid, requires_approval, allow_carry_over, max_carry_over_days, min_advance_days, max_consecutive_days, is_active, sort_order, color, created_at, updated_at)
	SELECT 'PC', 'Izin Pulang Cepat', 'Izin pulang lebih awal sebelum jam shift berakhir', 0, true, true, false, 0, 0, 1, true, 7, 'orange', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
	WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'PC');
	`
	if _, err := db.Exec(initSchema); err != nil {
		log.Printf("Warning: Failed to auto-migrate schema/seed: %v", err)
	}

	return db
}
