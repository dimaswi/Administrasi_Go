package repository

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type WorkScheduleRepository struct {
	db *sqlx.DB
}

func NewWorkScheduleRepository(db *sqlx.DB) *WorkScheduleRepository {
	return &WorkScheduleRepository{db: db}
}

func (r *WorkScheduleRepository) GetAll() ([]models.WorkSchedule, error) {
	schedules := []models.WorkSchedule{}
	err := r.db.Select(&schedules, "SELECT * FROM work_schedules WHERE deleted_at IS NULL ORDER BY name")
	return schedules, err
}

func (r *WorkScheduleRepository) GetByID(id int) (*models.WorkSchedule, error) {
	var schedule models.WorkSchedule
	err := r.db.Get(&schedule, "SELECT * FROM work_schedules WHERE id = $1 AND deleted_at IS NULL", id)
	return &schedule, err
}

func (r *WorkScheduleRepository) Create(schedule *models.WorkSchedule) error {
	query := `
		INSERT INTO work_schedules (
			code, name, description, clock_in_time, clock_out_time, break_start, break_end, is_special,
			late_tolerance, early_leave_tolerance, is_flexible, flexible_minutes, work_hours_per_day,
			is_active, created_at, updated_at
		) VALUES (
			:code, :name, :description, :clock_in_time, :clock_out_time, :break_start, :break_end, :is_special,
			:late_tolerance, :early_leave_tolerance, :is_flexible, :flexible_minutes, :work_hours_per_day,
			:is_active, :created_at, :updated_at
		) RETURNING id
	`
	rows, err := r.db.NamedQuery(query, schedule)
	if err != nil {
		return err
	}
	defer rows.Close()

	if rows.Next() {
		rows.Scan(&schedule.ID)
	}
	return nil
}

func (r *WorkScheduleRepository) Update(id int, schedule *models.WorkSchedule) error {
	query := `
		UPDATE work_schedules SET
			code = :code, name = :name, description = :description, clock_in_time = :clock_in_time,
			clock_out_time = :clock_out_time, break_start = :break_start, break_end = :break_end,
			is_special = :is_special, late_tolerance = :late_tolerance, early_leave_tolerance = :early_leave_tolerance,
			is_flexible = :is_flexible, flexible_minutes = :flexible_minutes, work_hours_per_day = :work_hours_per_day,
			is_active = :is_active, updated_at = CURRENT_TIMESTAMP
		WHERE id = :id
	`
	schedule.ID = id
	_, err := r.db.NamedExec(query, schedule)
	return err
}

func (r *WorkScheduleRepository) Delete(id int) error {
	_, err := r.db.Exec("UPDATE work_schedules SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1", id)
	return err
}
