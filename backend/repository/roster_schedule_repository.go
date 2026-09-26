package repository

import (
	"backend/models"
	"fmt"
	"math"
	"math/rand"
	"time"

	"github.com/jmoiron/sqlx"
)

type RosterScheduleRepository struct {
	db *sqlx.DB
}

func NewRosterScheduleRepository(db *sqlx.DB) *RosterScheduleRepository {
	return &RosterScheduleRepository{db: db}
}

func (r *RosterScheduleRepository) GetAll(page, perPage int, search string, employeeID int) (models.PaginatedResponse, error) {
	schedules := []models.RosterSchedule{}
	offset := (page - 1) * perPage

	query := `
		SELECT 
			r.id, e.id AS employee_id, r.work_schedule_id, r.date, r.notes, r.created_at, r.updated_at,
			TRIM(COALESCE(e.first_name, '') || ' ' || COALESCE(e.last_name, '')) AS employee_name,
			w.name AS work_schedule_name
		FROM roster_schedules r
		LEFT JOIN employees e ON r.employee_id = e.user_id
		LEFT JOIN work_schedules w ON r.work_schedule_id = w.id
		WHERE 1=1
	`
	countQuery := `
		SELECT COUNT(*) 
		FROM roster_schedules r
		LEFT JOIN employees e ON r.employee_id = e.user_id
		LEFT JOIN work_schedules w ON r.work_schedule_id = w.id
		WHERE 1=1
	`
	var args []interface{}
	argId := 1

	if search != "" {
		searchTerm := "%" + search + "%"
		query += fmt.Sprintf(` AND (e.first_name ILIKE $%d OR e.last_name ILIKE $%d OR w.name ILIKE $%d)`, argId, argId, argId)
		countQuery += fmt.Sprintf(` AND (e.first_name ILIKE $%d OR e.last_name ILIKE $%d OR w.name ILIKE $%d)`, argId, argId, argId)
		args = append(args, searchTerm)
		argId++
	}

	if employeeID > 0 {
		query += fmt.Sprintf(` AND e.id = $%d`, argId)
		countQuery += fmt.Sprintf(` AND e.id = $%d`, argId)
		args = append(args, employeeID)
		argId++
	}

	query += fmt.Sprintf(` ORDER BY r.date DESC LIMIT $%d OFFSET $%d`, argId, argId+1)

	var total int
	err := r.db.Get(&total, countQuery, args...)
	if err != nil {
		return models.PaginatedResponse{}, err
	}

	args = append(args, perPage, offset)
	err = r.db.Select(&schedules, query, args...)
	if err != nil {
		return models.PaginatedResponse{}, err
	}

	if schedules == nil {
		schedules = []models.RosterSchedule{}
	}

	lastPage := int(math.Ceil(float64(total) / float64(perPage)))
	if lastPage == 0 {
		lastPage = 1
	}

	return models.PaginatedResponse{
		Data: schedules,
		PaginationMeta: models.PaginationMeta{
			CurrentPage: page,
			LastPage:    lastPage,
			PerPage:     perPage,
			Total:       total,
		},
	}, nil
}

func (r *RosterScheduleRepository) GetByID(id int) (*models.RosterSchedule, error) {
	var schedule models.RosterSchedule
	err := r.db.Get(&schedule, "SELECT * FROM roster_schedules WHERE id = $1", id)
	if err != nil {
		return nil, err
	}
	return &schedule, nil
}

func (r *RosterScheduleRepository) UpdateEmployeeID(id int, newEmployeeID int) error {
	query := `
		UPDATE roster_schedules
		SET employee_id = $1, updated_at = $2
		WHERE id = $3
	`
	_, err := r.db.Exec(query, newEmployeeID, time.Now(), id)
	return err
}

func (r *RosterScheduleRepository) Create(schedule *models.RosterSchedule) error {
	query := `
		INSERT INTO roster_schedules (
			employee_id, work_schedule_id, date, notes, created_at, updated_at
		) VALUES (
			:employee_id, :work_schedule_id, :date, :notes, :created_at, :updated_at
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
		SELECT r.id, e.id AS employee_id, r.work_schedule_id, r.date, r.notes, r.created_at, r.updated_at 
		FROM roster_schedules r
		JOIN employees e ON r.employee_id = e.user_id
		WHERE TO_CHAR(r.date, 'YYYY-MM') = $1
	`
	err := r.db.Select(&schedules, query, yearMonth)
	return schedules, err
}

func (r *RosterScheduleRepository) AssignShift(employeeID int, date string, workScheduleID int) error {
	var userID int
	err := r.db.Get(&userID, "SELECT user_id FROM employees WHERE id = $1", employeeID)
	if err != nil {
		return err
	}

	if workScheduleID == 0 {
		// If workScheduleID is 0, it means delete the shift (off day)
		_, err := r.db.Exec("DELETE FROM roster_schedules WHERE employee_id = $1 AND date = $2", userID, date)
		return err
	}

	var count int
	err = r.db.Get(&count, "SELECT COUNT(*) FROM roster_schedules WHERE employee_id = $1 AND date = $2", userID, date)
	if err != nil {
		return err
	}

	if count > 0 {
		_, err = r.db.Exec("UPDATE roster_schedules SET work_schedule_id = $1, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $2 AND date = $3", workScheduleID, userID, date)
	} else {
		_, err = r.db.Exec("INSERT INTO roster_schedules (employee_id, work_schedule_id, date) VALUES ($1, $2, $3)", userID, workScheduleID, date)
	}
	return err
}

func (r *RosterScheduleRepository) CheckConflicts(employeeID int, unitID int, startDate string, endDate string) (int, error) {
	var count int
	query := `
		SELECT COUNT(*) FROM roster_schedules r
		JOIN employees e ON r.employee_id = e.user_id
		WHERE r.date >= $1 AND r.date <= $2
	`
	args := []interface{}{startDate, endDate}

	if employeeID > 0 {
		query += " AND e.id = $3"
		args = append(args, employeeID)
	} else if unitID > 0 {
		query += " AND e.organization_unit_id = $3"
		args = append(args, unitID)
	}

	err := r.db.Get(&count, query, args...)
	return count, err
}

func (r *RosterScheduleRepository) AutoGenerate(employeeID, unitID int, startDate, endDate, workDaysPattern string, workScheduleIDs []int, overwrite bool) error {
	if len(workScheduleIDs) == 0 {
		return nil
	}
	
	rand.Seed(time.Now().UnixNano())
	var employeeIDs []int
	empQuery := "SELECT user_id FROM employees WHERE user_id IS NOT NULL"
	var empArgs []interface{}
	if employeeID > 0 {
		empQuery += " AND id = $1"
		empArgs = append(empArgs, employeeID)
	} else if unitID > 0 {
		empQuery += " AND organization_unit_id = $1"
		empArgs = append(empArgs, unitID)
	}
	
	var err error
	err = r.db.Select(&employeeIDs, empQuery, empArgs...)
	if err != nil {
		return err
	}
	if len(employeeIDs) == 0 {
		return nil // No users to generate for
	}

	// Begin transaction
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Convert dates
	start, err := time.Parse("2006-01-02", startDate)
	if err != nil { return err }
	end, err := time.Parse("2006-01-02", endDate)
	if err != nil { return err }

	var insertedCount int
	for _, eid := range employeeIDs {
		current := start
		for !current.After(end) {
			// Check day pattern
			weekday := current.Weekday()
			shouldAssign := true
			if workDaysPattern == "mon-fri" && (weekday == time.Saturday || weekday == time.Sunday) {
				shouldAssign = false
			} else if workDaysPattern == "mon-sat" && weekday == time.Sunday {
				shouldAssign = false
			}

			if shouldAssign {
				dateStr := current.Format("2006-01-02")
				
				// check if exists
				var count int
				err = tx.Get(&count, "SELECT COUNT(*) FROM roster_schedules WHERE employee_id = $1 AND date = $2", eid, dateStr)
				if err != nil { return err }

				if count > 0 {
					if overwrite {
						// Randomly pick a shift
						pickedShiftID := workScheduleIDs[rand.Intn(len(workScheduleIDs))]
						_, err = tx.Exec("UPDATE roster_schedules SET work_schedule_id = $1, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $2 AND date = $3", pickedShiftID, eid, dateStr)
						if err != nil { return err }
						insertedCount++
					}
				} else {
					// Randomly pick a shift
					pickedShiftID := workScheduleIDs[rand.Intn(len(workScheduleIDs))]
					_, err = tx.Exec("INSERT INTO roster_schedules (employee_id, work_schedule_id, date) VALUES ($1, $2, $3)", eid, pickedShiftID, dateStr)
					if err != nil { return err }
					insertedCount++
				}
			} else {
				// if it shouldn't assign (e.g. weekend), and overwrite is true, we delete the existing shift if any
				if overwrite {
					dateStr := current.Format("2006-01-02")
					_, err = tx.Exec("DELETE FROM roster_schedules WHERE employee_id = $1 AND date = $2", eid, dateStr)
					if err != nil { return err }
				}
			}
			current = current.AddDate(0, 0, 1)
		}
	}
	
	fmt.Printf("AutoGenerate: Inserted/Updated %d shifts for %d employees (pattern: %s, startDate: %s, endDate: %s)\n", insertedCount, len(employeeIDs), workDaysPattern, startDate, endDate)

	return tx.Commit()
}
