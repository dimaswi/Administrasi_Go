package repository

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type RosterScheduleRepository struct {
	db *sqlx.DB
}

func NewRosterScheduleRepository(db *sqlx.DB) *RosterScheduleRepository {
	return &RosterScheduleRepository{db: db}
}

func (r *RosterScheduleRepository) GetAll() ([]models.RosterSchedule, error) {
	schedules := []models.RosterSchedule{}
	err := r.db.Select(&schedules, "SELECT * FROM roster_schedules ORDER BY date DESC")
	return schedules, err
}

func (r *RosterScheduleRepository) Create(schedule *models.RosterSchedule) error {
	query := `
		INSERT INTO roster_schedules (
			user_id, work_schedule_id, date, notes, created_at, updated_at
		) VALUES (
			:user_id, :work_schedule_id, :date, :notes, :created_at, :updated_at
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

func (r *RosterScheduleRepository) GetByUnitAndMonth(unitID int, yearMonth string) ([]models.RosterSchedule, error) {
	schedules := []models.RosterSchedule{}
	query := `
		SELECT r.* FROM roster_schedules r
		JOIN users u ON r.user_id = u.id
		WHERE u.organization_unit_id = $1 AND TO_CHAR(r.date, 'YYYY-MM') = $2
	`
	err := r.db.Select(&schedules, query, unitID, yearMonth)
	return schedules, err
}

func (r *RosterScheduleRepository) AssignShift(userID int, date string, workScheduleID int) error {
	if workScheduleID == 0 {
		// If workScheduleID is 0, it means delete the shift (off day)
		_, err := r.db.Exec("DELETE FROM roster_schedules WHERE user_id = $1 AND date = $2", userID, date)
		return err
	}

	var count int
	err := r.db.Get(&count, "SELECT COUNT(*) FROM roster_schedules WHERE user_id = $1 AND date = $2", userID, date)
	if err != nil {
		return err
	}

	if count > 0 {
		_, err = r.db.Exec("UPDATE roster_schedules SET work_schedule_id = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND date = $3", workScheduleID, userID, date)
	} else {
		_, err = r.db.Exec("INSERT INTO roster_schedules (user_id, work_schedule_id, date) VALUES ($1, $2, $3)", userID, workScheduleID, date)
	}
	return err
}
