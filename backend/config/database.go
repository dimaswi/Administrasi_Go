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

	-- Migration for Multi-Shift Attendance support per day
	DO $$
	BEGIN
		IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendances_employee_id_date_unique') THEN
			ALTER TABLE attendances DROP CONSTRAINT attendances_employee_id_date_unique;
		END IF;
		IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'attendances_emp_date_ws_unique') THEN
			CREATE UNIQUE INDEX attendances_emp_date_ws_unique ON attendances (employee_id, date, COALESCE(work_schedule_id, 0));
		END IF;
	END $$;

	CREATE TABLE IF NOT EXISTS trainings (
		id SERIAL PRIMARY KEY,
		code VARCHAR(50) NOT NULL UNIQUE,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		type VARCHAR(50) NOT NULL,
		category VARCHAR(50),
		provider VARCHAR(255),
		duration_hours INT,
		cost NUMERIC(15,2),
		location VARCHAR(255),
		is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
		is_active BOOLEAN NOT NULL DEFAULT TRUE,
		objectives TEXT,
		prerequisites TEXT,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS employee_trainings (
		id SERIAL PRIMARY KEY,
		employee_id INT NOT NULL,
		training_id INT NOT NULL,
		status VARCHAR(50) NOT NULL DEFAULT 'registered',
		start_date DATE,
		end_date DATE,
		completion_date DATE,
		score NUMERIC(5,2),
		grade VARCHAR(10),
		certificate_number VARCHAR(100),
		certificate_path VARCHAR(255),
		certificate_expiry DATE,
		feedback TEXT,
		rating INT,
		notes TEXT,
		approved_by INT,
		approved_at TIMESTAMP,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS performance_periods (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		type VARCHAR(50) NOT NULL,
		start_date DATE NOT NULL,
		end_date DATE NOT NULL,
		status VARCHAR(50) NOT NULL DEFAULT 'draft',
		description TEXT,
		is_current BOOLEAN NOT NULL DEFAULT FALSE,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS performance_reviews (
		id SERIAL PRIMARY KEY,
		employee_id INT NOT NULL,
		period_id INT NOT NULL,
		reviewer_id INT,
		status VARCHAR(50) NOT NULL DEFAULT 'draft',
		self_score NUMERIC(5,2),
		manager_score NUMERIC(5,2),
		final_score NUMERIC(5,2),
		final_grade VARCHAR(10),
		employee_notes TEXT,
		manager_notes TEXT,
		strengths TEXT,
		improvements TEXT,
		development_plan TEXT,
		self_reviewed_at TIMESTAMP,
		manager_reviewed_at TIMESTAMP,
		completed_at TIMESTAMP,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS feedback_360_sessions (
		id SERIAL PRIMARY KEY,
		period_id INT NOT NULL,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		start_date DATE NOT NULL,
		end_date DATE NOT NULL,
		status VARCHAR(50) NOT NULL DEFAULT 'draft',
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS feedback_360_participants (
		id SERIAL PRIMARY KEY,
		session_id INT NOT NULL,
		employee_id INT NOT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS calibration_sessions (
		id SERIAL PRIMARY KEY,
		period_id INT NOT NULL,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		date DATE NOT NULL,
		status VARCHAR(50) NOT NULL DEFAULT 'draft',
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS calibration_reviews (
		id SERIAL PRIMARY KEY,
		session_id INT NOT NULL,
		review_id INT NOT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	`
	if _, err := db.Exec(initSchema); err != nil {
		log.Printf("Warning: Failed to auto-migrate schema/seed: %v", err)
	}

	return db
}
