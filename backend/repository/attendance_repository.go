package repository

import (
	"backend/models"
	"math"
	"strconv"

	"github.com/jmoiron/sqlx"
)

type AttendanceRepository struct {
	db *sqlx.DB
}

func NewAttendanceRepository(db *sqlx.DB) *AttendanceRepository {
	return &AttendanceRepository{db: db}
}

func (r *AttendanceRepository) GetAll(page int, perPage int, search string) (models.PaginatedResponse, error) {
	var attendances []models.Attendance
	offset := (page - 1) * perPage

	baseQuery := `
		FROM attendances a
		JOIN employees e ON a.employee_id = e.id
		LEFT JOIN work_schedules ws ON a.work_schedule_id = ws.id
		LEFT JOIN roster_schedules rs ON rs.employee_id = a.employee_id 
			AND rs.date::date = a.date::date
		LEFT JOIN work_schedules ws_r ON rs.work_schedule_id = ws_r.id
		WHERE a.deleted_at IS NULL
	`
	
	args := []interface{}{}
	argId := 1

	if search != "" {
		baseQuery += " AND (e.first_name ILIKE $" + strconv.Itoa(argId) + " OR e.last_name ILIKE $" + strconv.Itoa(argId) + ")"
		args = append(args, "%"+search+"%")
		argId++
	}

	countQuery := "SELECT COUNT(*) " + baseQuery
	var total int
	err := r.db.Get(&total, countQuery, args...)
	if err != nil {
		return models.PaginatedResponse{}, err
	}

	query := `
		SELECT 
			a.id, a.employee_id, a.date, 
			a.clock_in::text, a.clock_out::text,
			a.work_schedule_id, a.status, a.notes,
			a.is_manual_entry, a.late_minutes,
			a.created_at, a.updated_at,
			e.first_name || ' ' || COALESCE(e.last_name, '') as employee_name,
			COALESCE(ws.name, ws_r.name) as work_schedule_name
	` + baseQuery + " ORDER BY a.date DESC, a.clock_in DESC LIMIT $" + strconv.Itoa(argId) + " OFFSET $" + strconv.Itoa(argId+1)

	args = append(args, perPage, offset)
	err = r.db.Select(&attendances, query, args...)
	if err != nil {
		return models.PaginatedResponse{}, err
	}

	if attendances == nil {
		attendances = []models.Attendance{}
	}

	lastPage := int(math.Ceil(float64(total) / float64(perPage)))
	if lastPage == 0 {
		lastPage = 1
	}

	return models.PaginatedResponse{
		Data:        attendances,
		PaginationMeta: models.PaginationMeta{
			CurrentPage: page,
			LastPage:    lastPage,
			PerPage:     perPage,
			Total:       total,
		},
	}, nil
}

func (r *AttendanceRepository) GetByEmployeeIDAndDate(employeeID int, date string) (*models.Attendance, error) {
	attendance := models.Attendance{}
	query := `
		SELECT id, employee_id, date, 
			clock_in::text, clock_out::text,
			work_schedule_id, status, notes,
			is_manual_entry, late_minutes,
			created_at, updated_at
		FROM attendances 
		WHERE employee_id = $1 AND date = $2 AND deleted_at IS NULL
	`
	err := r.db.Get(&attendance, query, employeeID, date)
	if err != nil {
		return nil, err
	}
	return &attendance, nil
}

func (r *AttendanceRepository) CheckIn(attendance *models.Attendance) error {
	query := `
		INSERT INTO attendances (
			employee_id, date, clock_in, work_schedule_id, status, late_minutes, is_manual_entry, created_at, updated_at
		) VALUES (
			:employee_id, :date, :clock_in, :work_schedule_id, :status, :late_minutes, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
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

func (r *AttendanceRepository) CheckOut(employeeID int, date string, clockOutTime string) error {
	query := `
		UPDATE attendances 
		SET clock_out = $1, updated_at = CURRENT_TIMESTAMP 
		WHERE employee_id = $2 AND date = $3
	`
	_, err := r.db.Exec(query, clockOutTime, employeeID, date)
	return err
}

func (r *AttendanceRepository) Update(id int, clockIn, clockOut *string, status string, notes *string) error {
	query := `
		UPDATE attendances 
		SET clock_in = $1, clock_out = $2, status = $3, notes = $4, updated_at = CURRENT_TIMESTAMP 
		WHERE id = $5 AND deleted_at IS NULL
	`
	_, err := r.db.Exec(query, clockIn, clockOut, status, notes, id)
	return err
}

// GetWorkScheduleForEmployee returns clock_in_time, late_tolerance, work_schedule_id for a given employee and date
func (r *AttendanceRepository) GetWorkScheduleForEmployee(employeeID int, date string) (clockInTime string, lateTolerance int, workScheduleID *int, found bool) {
	var result struct {
		ClockInTime    string `db:"clock_in_time"`
		LateTolerance  int    `db:"late_tolerance"`
		WorkScheduleID int    `db:"work_schedule_id"`
	}
	// Check roster schedule first, then employee schedule
	query := `
		SELECT ws.clock_in_time::text, ws.late_tolerance, ws.id as work_schedule_id
		FROM roster_schedules rs
		JOIN work_schedules ws ON rs.work_schedule_id = ws.id
		WHERE rs.employee_id = $1 AND rs.date::date = $2::date
		  AND ws.deleted_at IS NULL
		LIMIT 1
	`
	err := r.db.Get(&result, query, employeeID, date)
	if err != nil {
		// fallback: employee_schedules
		query2 := `
			SELECT ws.clock_in_time::text, ws.late_tolerance, ws.id as work_schedule_id
			FROM employee_schedules es
			JOIN work_schedules ws ON es.work_schedule_id = ws.id
			WHERE es.employee_id = $1 AND ws.deleted_at IS NULL
			LIMIT 1
		`
		err2 := r.db.Get(&result, query2, employeeID)
		if err2 != nil {
			return "", 0, nil, false
		}
	}
	wsID := result.WorkScheduleID
	return result.ClockInTime, result.LateTolerance, &wsID, true
}
