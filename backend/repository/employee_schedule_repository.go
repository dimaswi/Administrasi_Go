package repository

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type EmployeeScheduleRepository struct {
	db *sqlx.DB
}

func NewEmployeeScheduleRepository(db *sqlx.DB) *EmployeeScheduleRepository {
	return &EmployeeScheduleRepository{db: db}
}

func (r *EmployeeScheduleRepository) GetAll() ([]models.EmployeeSchedule, error) {
	schedules := []models.EmployeeSchedule{}
	err := r.db.Select(&schedules, "SELECT * FROM employee_schedules ORDER BY start_date DESC")
	return schedules, err
}

func (r *EmployeeScheduleRepository) GetByUserID(userID int) ([]models.EmployeeSchedule, error) {
	schedules := []models.EmployeeSchedule{}
	err := r.db.Select(&schedules, "SELECT * FROM employee_schedules WHERE user_id = $1 ORDER BY start_date DESC", userID)
	return schedules, err
}

func (r *EmployeeScheduleRepository) Create(schedule *models.EmployeeSchedule) error {
	query := `
		INSERT INTO employee_schedules (
			user_id, start_date, end_date, monday_shift_id, tuesday_shift_id, wednesday_shift_id,
			thursday_shift_id, friday_shift_id, saturday_shift_id, sunday_shift_id, created_at, updated_at
		) VALUES (
			:user_id, :start_date, :end_date, :monday_shift_id, :tuesday_shift_id, :wednesday_shift_id,
			:thursday_shift_id, :friday_shift_id, :saturday_shift_id, :sunday_shift_id, :created_at, :updated_at
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
