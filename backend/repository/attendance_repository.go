package repository

import (
	"backend/models"
	"time"

	"github.com/jmoiron/sqlx"
)

type AttendanceRepository struct {
	db *sqlx.DB
}

func NewAttendanceRepository(db *sqlx.DB) *AttendanceRepository {
	return &AttendanceRepository{db: db}
}

func (r *AttendanceRepository) GetAll() ([]models.Attendance, error) {
	attendances := []models.Attendance{}
	query := `
		SELECT a.*, u.name as user_name, ws.name as work_schedule_name
		FROM attendances a
		JOIN users u ON a.user_id = u.id
		LEFT JOIN work_schedules ws ON a.work_schedule_id = ws.id
		ORDER BY a.date DESC, a.clock_in DESC
	`
	err := r.db.Select(&attendances, query)
	return attendances, err
}

func (r *AttendanceRepository) GetByUserIDAndDate(userID int, date string) (*models.Attendance, error) {
	attendance := models.Attendance{}
	err := r.db.Get(&attendance, "SELECT * FROM attendances WHERE user_id = $1 AND date = $2", userID, date)
	if err != nil {
		return nil, err
	}
	return &attendance, nil
}

func (r *AttendanceRepository) CheckIn(attendance *models.Attendance) error {
	query := `
		INSERT INTO attendances (
			user_id, date, clock_in, work_schedule_id, status, notes, created_at, updated_at
		) VALUES (
			:user_id, :date, :clock_in, :work_schedule_id, :status, :notes, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
		) RETURNING id, created_at, updated_at
	`
	rows, err := r.db.NamedQuery(query, attendance)
	if err != nil {
		return err
	}
	defer rows.Close()

	if rows.Next() {
		rows.Scan(&attendance.ID, &attendance.CreatedAt, &attendance.UpdatedAt)
	}
	return nil
}

func (r *AttendanceRepository) CheckOut(userID int, date string, clockOut time.Time, status string) error {
	query := `
		UPDATE attendances 
		SET clock_out = $1, status = $2, updated_at = CURRENT_TIMESTAMP 
		WHERE user_id = $3 AND date = $4
	`
	_, err := r.db.Exec(query, clockOut, status, userID, date)
	return err
}
