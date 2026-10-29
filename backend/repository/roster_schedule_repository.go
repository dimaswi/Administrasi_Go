package repository

import (
	"backend/models"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

type RosterScheduleRepository struct {
	db *sqlx.DB
}

func NewRosterScheduleRepository(db *sqlx.DB) *RosterScheduleRepository {
	return &RosterScheduleRepository{db: db}
}

func (r *RosterScheduleRepository) GetAll(page, perPage int, search string, employeeID int, date string, startDate string, endDate string) (models.PaginatedResponse, error) {
	schedules := []models.RosterSchedule{}
	offset := (page - 1) * perPage

	query := `
		SELECT 
			r.id, COALESCE(e.id, r.employee_id) AS employee_id, r.work_schedule_id, r.date, r.notes, r.created_at, r.updated_at,
			TRIM(COALESCE(e.first_name, '') || ' ' || COALESCE(e.last_name, '')) AS employee_name,
			COALESCE(w.name, '-') AS work_schedule_name,
			COALESCE(w.clock_in_time::text, '08:00') AS clock_in_time,
			COALESCE(w.clock_out_time::text, '16:00') AS clock_out_time
		FROM roster_schedules r
		LEFT JOIN employees e ON (r.employee_id = e.user_id OR r.employee_id = e.id)
		LEFT JOIN work_schedules w ON r.work_schedule_id = w.id
		WHERE 1=1
	`
	countQuery := `
		SELECT COUNT(*) 
		FROM roster_schedules r
		LEFT JOIN employees e ON (r.employee_id = e.user_id OR r.employee_id = e.id)
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
		query += fmt.Sprintf(` AND (e.id = $%d OR r.employee_id = $%d)`, argId, argId)
		countQuery += fmt.Sprintf(` AND (e.id = $%d OR r.employee_id = $%d)`, argId, argId)
		args = append(args, employeeID)
		argId++
	}

	if date != "" {
		query += fmt.Sprintf(` AND r.date::date = $%d::date`, argId)
		countQuery += fmt.Sprintf(` AND r.date::date = $%d::date`, argId)
		args = append(args, date)
		argId++
	}

	if startDate != "" {
		query += fmt.Sprintf(` AND r.date::date >= $%d::date`, argId)
		countQuery += fmt.Sprintf(` AND r.date::date >= $%d::date`, argId)
		args = append(args, startDate)
		argId++
	}

	if endDate != "" {
		query += fmt.Sprintf(` AND r.date::date <= $%d::date`, argId)
		countQuery += fmt.Sprintf(` AND r.date::date <= $%d::date`, argId)
		args = append(args, endDate)
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
	var userID int
	if err := r.db.Get(&userID, "SELECT user_id FROM employees WHERE id = $1", newEmployeeID); err == nil && userID > 0 {
		newEmployeeID = userID
	}

	query := `
		UPDATE roster_schedules
		SET employee_id = $1, updated_at = $2
		WHERE id = $3
	`
	_, err := r.db.Exec(query, newEmployeeID, time.Now(), id)
	return err
}

func (r *RosterScheduleRepository) Create(schedule *models.RosterSchedule) error {
	if schedule.EmployeeID != nil {
		var userID int
		if err := r.db.Get(&userID, "SELECT user_id FROM employees WHERE id = $1", *schedule.EmployeeID); err == nil && userID > 0 {
			schedule.EmployeeID = &userID
		}
	}

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
		JOIN employees e ON (r.employee_id = e.user_id OR r.employee_id = e.id)
		WHERE TO_CHAR(r.date, 'YYYY-MM') = $1
	`
	args := []interface{}{yearMonth}
	if unitID > 0 {
		query += " AND e.organization_unit_id = $2"
		args = append(args, unitID)
	}
	err := r.db.Select(&schedules, query, args...)
	return schedules, err
}

func parseTimeToHours(tStr string) float64 {
	if len(tStr) >= 5 {
		if strings.Contains(tStr, "T") {
			parts := strings.Split(tStr, "T")
			if len(parts) > 1 {
				tStr = parts[1]
			}
		}
		parts := strings.Split(tStr, ":")
		if len(parts) >= 2 {
			h, _ := strconv.ParseFloat(parts[0], 64)
			m, _ := strconv.ParseFloat(parts[1], 64)
			return h + (m / 60.0)
		}
	}
	return 0
}

func (r *RosterScheduleRepository) AssignShift(employeeID int, date string, workScheduleID int, deleteShiftID int) error {
	var userID int
	_ = r.db.Get(&userID, "SELECT user_id FROM employees WHERE id = $1", employeeID)

	targetUserID := employeeID
	if userID > 0 {
		targetUserID = userID
	}

	dateStr := date
	if len(dateStr) > 10 {
		dateStr = dateStr[:10]
	}

	if workScheduleID == 0 {
		if deleteShiftID > 0 {
			_, err := r.db.Exec("DELETE FROM roster_schedules WHERE (employee_id = $1 OR employee_id = $2) AND date::date = $3::date AND work_schedule_id = $4", targetUserID, employeeID, dateStr, deleteShiftID)
			return err
		}
		// If workScheduleID is 0 and no deleteShiftID specified, delete all shifts on that date
		_, err := r.db.Exec("DELETE FROM roster_schedules WHERE (employee_id = $1 OR employee_id = $2) AND date::date = $3::date", targetUserID, employeeID, dateStr)
		return err
	}

	// 1. Fetch new shift to assign
	var newShift models.WorkSchedule
	err := r.db.Get(&newShift, "SELECT * FROM work_schedules WHERE id = $1 AND deleted_at IS NULL", workScheduleID)
	if err != nil {
		return fmt.Errorf("Shift tidak ditemukan")
	}

	// 2. Fetch existing shifts around dateStr (H-1, H, H+1)
	type ExistingRoster struct {
		ID             int    `db:"id"`
		WorkScheduleID int    `db:"work_schedule_id"`
		Date           string `db:"date"`
		Name           string `db:"name"`
		ClockInTime    string `db:"clock_in_time"`
		ClockOutTime   string `db:"clock_out_time"`
	}

	var existingRosters []ExistingRoster
	queryEx := `
		SELECT rs.id, rs.work_schedule_id, rs.date::text, ws.name, ws.clock_in_time::text, ws.clock_out_time::text
		FROM roster_schedules rs
		JOIN work_schedules ws ON rs.work_schedule_id = ws.id
		WHERE (rs.employee_id = $1 OR rs.employee_id = $2)
		  AND rs.date::date >= ($3::date - INTERVAL '1 day')
		  AND rs.date::date <= ($3::date + INTERVAL '1 day')
		  AND ws.deleted_at IS NULL
	`
	err = r.db.Select(&existingRosters, queryEx, targetUserID, employeeID, dateStr)
	if err != nil {
		return err
	}

	targetDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("Format tanggal tidak valid")
	}

	newIn := parseTimeToHours(newShift.ClockInTime)
	newOut := parseTimeToHours(newShift.ClockOutTime)
	newDur := newOut - newIn
	if newOut <= newIn {
		newDur = (newOut + 24.0) - newIn
	}
	newStart := newIn
	newEnd := newIn + newDur

	// Check conflict with existing shifts
	for _, ex := range existingRosters {
		exDStr := ex.Date
		if len(exDStr) >= 10 {
			exDStr = exDStr[:10]
		}
		exDate, err := time.Parse("2006-01-02", exDStr)
		if err != nil {
			continue
		}

		if exDStr == dateStr && ex.WorkScheduleID == workScheduleID {
			return nil // Already assigned, idempotent
		}

		diffDays := int(math.Round(exDate.Sub(targetDate).Hours() / 24.0))

		exIn := parseTimeToHours(ex.ClockInTime)
		exOut := parseTimeToHours(ex.ClockOutTime)
		exDur := exOut - exIn
		if exOut <= exIn {
			exDur = (exOut + 24.0) - exIn
		}

		exStart := float64(diffDays*24) + exIn
		exEnd := exStart + exDur

		// Overlap condition
		if math.Max(newStart, exStart) < math.Min(newEnd, exEnd) {
			formatTimeStr := func(t string) string {
				if len(t) >= 5 {
					return t[:5]
				}
				return t
			}
			return fmt.Errorf("Jadwal bentrok! Shift %s (%s - %s) bertabrakan dengan shift %s (%s - %s)",
				newShift.Name, formatTimeStr(newShift.ClockInTime), formatTimeStr(newShift.ClockOutTime),
				ex.Name, formatTimeStr(ex.ClockInTime), formatTimeStr(ex.ClockOutTime),
			)
		}
	}

	// 3. No conflict! Insert the new shift
	_, err = r.db.Exec("INSERT INTO roster_schedules (employee_id, work_schedule_id, date) VALUES ($1, $2, $3)", targetUserID, workScheduleID, dateStr)
	return err
}

func (r *RosterScheduleRepository) CheckConflicts(employeeID int, unitID int, startDate string, endDate string) (int, error) {
	var count int
	query := `
		SELECT COUNT(*) FROM roster_schedules r
		JOIN employees e ON (r.employee_id = e.user_id OR r.employee_id = e.id)
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

func (r *RosterScheduleRepository) AutoGenerate(employeeID, unitID int, startDate, endDate, workDaysPattern string, workScheduleIDs []int, overwrite bool, offDaysCount int, staffPerShift int) error {
	if len(workScheduleIDs) == 0 {
		return nil
	}

	// Begin transaction
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Fetch eligible employees
	type EmpRecord struct {
		ID                 int     `db:"id"`
		EmployeeID         string  `db:"employee_id"`
		FirstName          string  `db:"first_name"`
		LastName           *string `db:"last_name"`
		UserID             *int    `db:"user_id"`
		OrganizationUnitID *int    `db:"organization_unit_id"`
	}

	var employees []EmpRecord
	empQuery := `
		SELECT id, employee_id, first_name, last_name, user_id, organization_unit_id 
		FROM employees 
		WHERE deleted_at IS NULL AND status = 'active'
	`
	var empArgs []interface{}
	if employeeID > 0 {
		empQuery += " AND id = $1"
		empArgs = append(empArgs, employeeID)
	} else if unitID > 0 {
		empQuery += " AND organization_unit_id = $1"
		empArgs = append(empArgs, unitID)
	}
	empQuery += " ORDER BY id ASC"

	err = tx.Select(&employees, empQuery, empArgs...)
	if err != nil {
		return err
	}
	if len(employees) == 0 {
		return nil // No employees to schedule
	}

	// 2. Ensure each employee has a user account (foreign key constraint for roster_schedules)
	for i := range employees {
		if employees[i].UserID == nil || *employees[i].UserID == 0 {
			name := employees[i].FirstName
			if employees[i].LastName != nil && *employees[i].LastName != "" {
				name += " " + *employees[i].LastName
			}
			hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
			var newUserID int
			err = tx.QueryRow(`
				INSERT INTO users (name, nip, password, role_id, created_at, updated_at)
				VALUES ($1, $2, $3, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
				RETURNING id
			`, name, employees[i].EmployeeID, string(hashedPassword)).Scan(&newUserID)
			if err == nil {
				_, _ = tx.Exec("UPDATE employees SET user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", newUserID, employees[i].ID)
				employees[i].UserID = &newUserID
			}
		}
	}

	// 3. Convert dates
	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return err
	}
	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		return err
	}

	// 4. Fetch approved leaves for these employees during this date range
	type LeaveRecord struct {
		EmployeeID int    `db:"employee_id"`
		StartDate  string `db:"start_date"`
		EndDate    string `db:"end_date"`
	}
	var leaves []LeaveRecord
	leaveQuery := `
		SELECT employee_id, start_date::text, end_date::text 
		FROM leaves 
		WHERE status = 'approved' 
		  AND start_date::date <= $2::date 
		  AND end_date::date >= $1::date
	`
	_ = tx.Select(&leaves, leaveQuery, startDate, endDate)

	leaveMap := make(map[int]map[string]bool)
	for _, l := range leaves {
		lStart, err1 := time.Parse("2006-01-02", l.StartDate[:10])
		lEnd, err2 := time.Parse("2006-01-02", l.EndDate[:10])
		if err1 != nil || err2 != nil {
			continue
		}
		if _, ok := leaveMap[l.EmployeeID]; !ok {
			leaveMap[l.EmployeeID] = make(map[string]bool)
		}
		for curL := lStart; !curL.After(lEnd); curL = curL.AddDate(0, 0, 1) {
			leaveMap[l.EmployeeID][curL.Format("2006-01-02")] = true
		}
	}

	// 5. Fetch and sort selected work schedules by clock_in_time
	type ShiftInfo struct {
		ID           int    `db:"id"`
		Name         string `db:"name"`
		ClockInTime  string `db:"clock_in_time"`
		ClockOutTime string `db:"clock_out_time"`
	}
	var shifts []ShiftInfo
	queryShifts, argsShifts, err := sqlx.In("SELECT id, name, clock_in_time::text, clock_out_time::text FROM work_schedules WHERE id IN (?) ORDER BY clock_in_time ASC", workScheduleIDs)
	if err == nil {
		queryShifts = tx.Rebind(queryShifts)
		_ = tx.Select(&shifts, queryShifts, argsShifts...)
	}
	if len(shifts) == 0 {
		return fmt.Errorf("Shift tidak ditemukan")
	}

	if offDaysCount < 0 {
		offDaysCount = 0
	}
	if offDaysCount > 6 {
		offDaysCount = 6
	}

	numEmployees := len(employees)
	numShifts := len(shifts)

	var dates []time.Time
	for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
		dates = append(dates, d)
	}

	var insertedCount int

	// Single Employee Mode
	if employeeID > 0 {
		emp := employees[0]
		targetUserID := emp.ID
		if emp.UserID != nil && *emp.UserID > 0 {
			targetUserID = *emp.UserID
		}

		cycleLen := numShifts + offDaysCount
		if cycleLen < numShifts+1 && offDaysCount > 0 {
			cycleLen = numShifts + 1
		}

		for dayIdx, dTime := range dates {
			dateStr := dTime.Format("2006-01-02")
			weekday := dTime.Weekday()

			isWeekendOff := false
			if workDaysPattern == "mon-fri" && (weekday == time.Saturday || weekday == time.Sunday) {
				isWeekendOff = true
			} else if workDaysPattern == "mon-sat" && weekday == time.Sunday {
				isWeekendOff = true
			}

			isOnLeave := false
			if leaveMap[emp.ID] != nil && leaveMap[emp.ID][dateStr] {
				isOnLeave = true
			}
			if emp.UserID != nil && leaveMap[*emp.UserID] != nil && leaveMap[*emp.UserID][dateStr] {
				isOnLeave = true
			}

			var assignedShiftID int = 0
			if !isOnLeave && !isWeekendOff {
				if workDaysPattern == "all" && offDaysCount > 0 {
					pos := dayIdx % cycleLen
					if pos < numShifts {
						assignedShiftID = shifts[pos].ID
					}
				} else {
					assignedShiftID = shifts[dayIdx%numShifts].ID
				}
			}

			var existingCount int
			_ = tx.Get(&existingCount, "SELECT COUNT(*) FROM roster_schedules WHERE (employee_id = $1 OR employee_id = $2) AND date = $3", targetUserID, emp.ID, dateStr)
			if assignedShiftID > 0 {
				if existingCount > 0 {
					if overwrite {
						_, _ = tx.Exec("UPDATE roster_schedules SET work_schedule_id = $1, updated_at = CURRENT_TIMESTAMP WHERE (employee_id = $2 OR employee_id = $3) AND date = $4", assignedShiftID, targetUserID, emp.ID, dateStr)
						insertedCount++
					}
				} else {
					_, _ = tx.Exec("INSERT INTO roster_schedules (employee_id, work_schedule_id, date) VALUES ($1, $2, $3)", targetUserID, assignedShiftID, dateStr)
					insertedCount++
				}
			} else if overwrite && existingCount > 0 {
				_, _ = tx.Exec("DELETE FROM roster_schedules WHERE (employee_id = $1 OR employee_id = $2) AND date = $3", targetUserID, emp.ID, dateStr)
			}
		}

		fmt.Printf("AutoGenerate: Inserted/Updated %d shifts for employee %d\n", insertedCount, employeeID)
		return tx.Commit()
	}

	// 6. Multi-Member & Multi-Staff-per-Shift Scheduling Algorithm for Unit
	for dayIdx, dTime := range dates {
		dateStr := dTime.Format("2006-01-02")
		weekday := dTime.Weekday()

		isWeekendOff := false
		if workDaysPattern == "mon-fri" && (weekday == time.Saturday || weekday == time.Sunday) {
			isWeekendOff = true
		} else if workDaysPattern == "mon-sat" && weekday == time.Sunday {
			isWeekendOff = true
		}

		// Filter active working employees for today (not on approved leave)
		var availEmps []EmpRecord
		assignedToday := make(map[int]int) // emp.ID -> work_schedule_id

		for _, emp := range employees {
			isOnLeave := false
			if leaveMap[emp.ID] != nil && leaveMap[emp.ID][dateStr] {
				isOnLeave = true
			}
			if emp.UserID != nil && leaveMap[*emp.UserID] != nil && leaveMap[*emp.UserID][dateStr] {
				isOnLeave = true
			}
			if !isOnLeave && !isWeekendOff {
				availEmps = append(availEmps, emp)
			}
		}

		availCount := len(availEmps)
		if availCount > 0 {
			if numShifts == 1 {
				// Only 1 shift: ALL available members work on this shift!
				for _, emp := range availEmps {
					assignedToday[emp.ID] = shifts[0].ID
				}
			} else {
				// Multiple shifts selected
				quota := staffPerShift
				if quota <= 0 {
					// Auto / Bagi Rata
					if workDaysPattern == "all" && offDaysCount > 0 && availCount > numShifts {
						workingCount := (availCount * numShifts) / (numShifts + offDaysCount)
						if workingCount < numShifts {
							workingCount = numShifts
						}
						quota = int(math.Ceil(float64(workingCount) / float64(numShifts)))
					} else {
						quota = int(math.Ceil(float64(availCount) / float64(numShifts)))
					}
				}
				if quota < 1 {
					quota = 1
				}

				// Forward rotation step (Pagi -> Siang -> Malam -> Off)
				N := availCount
				stride := quota
				if stride < 1 {
					stride = 1
				}
				dayOffset := (dayIdx * (N - (stride % N))) % N

				p := 0
				for sIdx := 0; sIdx < numShifts; sIdx++ {
					sID := shifts[sIdx].ID
					for k := 0; k < quota && p < N; k++ {
						emp := availEmps[(p+dayOffset)%N]
						assignedToday[emp.ID] = sID
						p++
					}
				}

				// If staffPerShift <= 0 (bagi rata) and not rotating off, distribute remaining employees to shifts
				if staffPerShift <= 0 && (workDaysPattern != "all" || offDaysCount == 0) {
					for sIdx := 0; sIdx < numShifts && p < N; sIdx++ {
						sID := shifts[sIdx].ID
						emp := availEmps[(p+dayOffset)%N]
						assignedToday[emp.ID] = sID
						p++
					}
				}
			}
		}

		// Save/update/delete roster for all unit members on this date
		for _, emp := range employees {
			targetUserID := emp.ID
			if emp.UserID != nil && *emp.UserID > 0 {
				targetUserID = *emp.UserID
			}

			assignedShiftID := assignedToday[emp.ID]

			var existingCount int
			err = tx.Get(&existingCount, "SELECT COUNT(*) FROM roster_schedules WHERE (employee_id = $1 OR employee_id = $2) AND date = $3", targetUserID, emp.ID, dateStr)
			if err != nil {
				return err
			}

			if assignedShiftID > 0 {
				if existingCount > 0 {
					if overwrite {
						_, err = tx.Exec("UPDATE roster_schedules SET work_schedule_id = $1, updated_at = CURRENT_TIMESTAMP WHERE (employee_id = $2 OR employee_id = $3) AND date = $4", assignedShiftID, targetUserID, emp.ID, dateStr)
						if err != nil {
							return err
						}
						insertedCount++
					}
				} else {
					_, err = tx.Exec("INSERT INTO roster_schedules (employee_id, work_schedule_id, date) VALUES ($1, $2, $3)", targetUserID, assignedShiftID, dateStr)
					if err != nil {
						return err
					}
					insertedCount++
				}
			} else {
				if overwrite && existingCount > 0 {
					_, err = tx.Exec("DELETE FROM roster_schedules WHERE (employee_id = $1 OR employee_id = $2) AND date = $3", targetUserID, emp.ID, dateStr)
					if err != nil {
						return err
					}
				}
			}
		}
	}

	fmt.Printf("AutoGenerate: Inserted/Updated %d shifts for %d employees in unit %d (pattern: %s, staffPerShift: %d, %s to %s)\n", insertedCount, numEmployees, unitID, workDaysPattern, staffPerShift, startDate, endDate)
	return tx.Commit()
}
