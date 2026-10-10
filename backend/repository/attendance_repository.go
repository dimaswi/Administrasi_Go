package repository

import (
	"backend/models"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

type AttendanceRepository struct {
	db *sqlx.DB
}

func NewAttendanceRepository(db *sqlx.DB) *AttendanceRepository {
	return &AttendanceRepository{db: db}
}

func (r *AttendanceRepository) GetAll(page int, perPage int, search string, employeeID *int) (models.PaginatedResponse, error) {
	return r.GetAllWithFilters(page, perPage, search, employeeID, nil, "", "", "")
}

func (r *AttendanceRepository) GetAllWithFilters(page int, perPage int, search string, employeeID *int, unitID *int, startDate string, endDate string, status string) (models.PaginatedResponse, error) {
	var attendances []models.Attendance
	offset := (page - 1) * perPage

	baseQuery := `
		FROM attendances a
		JOIN employees e ON a.employee_id = e.id
		LEFT JOIN work_schedules ws ON a.work_schedule_id = ws.id
		LEFT JOIN roster_schedules rs ON (rs.employee_id = a.employee_id OR (e.user_id IS NOT NULL AND rs.employee_id = e.user_id)) 
			AND rs.date::date = a.date::date
		LEFT JOIN work_schedules ws_r ON rs.work_schedule_id = ws_r.id
		LEFT JOIN organization_units ou ON e.organization_unit_id = ou.id
		WHERE a.deleted_at IS NULL
	`

	args := []interface{}{}
	argId := 1

	if employeeID != nil && *employeeID > 0 {
		baseQuery += " AND a.employee_id = $" + strconv.Itoa(argId)
		args = append(args, *employeeID)
		argId++
	}

	if unitID != nil && *unitID > 0 {
		baseQuery += " AND e.organization_unit_id = $" + strconv.Itoa(argId)
		args = append(args, *unitID)
		argId++
	}

	if search != "" {
		baseQuery += " AND (e.first_name ILIKE $" + strconv.Itoa(argId) + " OR e.last_name ILIKE $" + strconv.Itoa(argId) + " OR e.employee_id ILIKE $" + strconv.Itoa(argId) + ")"
		args = append(args, "%"+search+"%")
		argId++
	}

	if startDate != "" {
		baseQuery += " AND a.date::date >= $" + strconv.Itoa(argId) + "::date"
		args = append(args, startDate)
		argId++
	}

	if endDate != "" {
		baseQuery += " AND a.date::date <= $" + strconv.Itoa(argId) + "::date"
		args = append(args, endDate)
		argId++
	}

	if status != "" && status != "all" {
		if status == "late" {
			baseQuery += " AND (a.status = 'late' OR a.late_minutes > 0)"
		} else {
			baseQuery += " AND a.status = $" + strconv.Itoa(argId)
			args = append(args, status)
			argId++
		}
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
			COALESCE(a.work_schedule_id, rs.work_schedule_id) as work_schedule_id, a.status, a.notes,
			a.is_manual_entry, a.late_minutes,
			a.created_at, a.updated_at,
			COALESCE(e.employee_id, '') as employee_code,
			e.first_name || ' ' || COALESCE(e.last_name, '') as employee_name,
			COALESCE(ou.name, '-') as unit_name,
			COALESCE(e.position, '-') as position,
			COALESCE(ws.name, ws_r.name, 'Reguler') as work_schedule_name,
			COALESCE(ws.clock_in_time::text, ws_r.clock_in_time::text, '08:00') as schedule_clock_in,
			COALESCE(ws.clock_out_time::text, ws_r.clock_out_time::text, '16:00') as schedule_clock_out
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
		Data: attendances,
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
		WHERE employee_id = $1 AND date::date = $2::date AND deleted_at IS NULL
		ORDER BY id DESC LIMIT 1
	`
	err := r.db.Get(&attendance, query, employeeID, date)
	if err != nil {
		return nil, err
	}
	return &attendance, nil
}

func (r *AttendanceRepository) GetActiveAttendanceForEmployee(employeeID int, date string) (*models.Attendance, error) {
	var attendance models.Attendance
	query := `
		SELECT id, employee_id, date, 
			clock_in::text, clock_out::text,
			work_schedule_id, status, notes,
			is_manual_entry, late_minutes,
			created_at, updated_at
		FROM attendances 
		WHERE employee_id = $1 AND date::date = $2::date AND clock_out IS NULL AND deleted_at IS NULL
		ORDER BY id DESC LIMIT 1
	`
	err := r.db.Get(&attendance, query, employeeID, date)
	if err != nil {
		return nil, err
	}
	return &attendance, nil
}

func (r *AttendanceRepository) GetCompletedWorkScheduleIDs(employeeID int, date string) ([]int, error) {
	var ids []int
	query := `
		SELECT DISTINCT work_schedule_id
		FROM attendances
		WHERE employee_id = $1 AND date::date = $2::date AND work_schedule_id IS NOT NULL AND deleted_at IS NULL
	`
	err := r.db.Select(&ids, query, employeeID, date)
	return ids, err
}

func (r *AttendanceRepository) GetCompletedAttendanceCount(employeeID int, date string) int {
	var count int
	query := `SELECT COUNT(*) FROM attendances WHERE employee_id = $1 AND date::date = $2::date AND clock_out IS NOT NULL AND deleted_at IS NULL`
	_ = r.db.Get(&count, query, employeeID, date)
	return count
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
		WHERE id = (
			SELECT id FROM attendances
			WHERE employee_id = $2 AND date::date = $3::date AND clock_out IS NULL AND deleted_at IS NULL
			ORDER BY id DESC LIMIT 1
		)
	`
	res, err := r.db.Exec(query, clockOutTime, employeeID, date)
	if err != nil {
		return err
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		// Fallback: update latest attendance on that date
		fallbackQuery := `
			UPDATE attendances 
			SET clock_out = $1, updated_at = CURRENT_TIMESTAMP 
			WHERE id = (
				SELECT id FROM attendances
				WHERE employee_id = $2 AND date::date = $3::date AND deleted_at IS NULL
				ORDER BY id DESC LIMIT 1
			)
		`
		_, err = r.db.Exec(fallbackQuery, clockOutTime, employeeID, date)
	}
	return err
}

func (r *AttendanceRepository) CheckOutWithDetails(employeeID int, date string, clockOutTime string, status *string, notes *string) error {
	activeCond := `
		WHERE id = (
			SELECT id FROM attendances
			WHERE employee_id = $4 AND date::date = $5::date AND clock_out IS NULL AND deleted_at IS NULL
			ORDER BY id DESC LIMIT 1
		)
	`
	if status != nil && *status != "" && notes != nil && *notes != "" {
		query := `UPDATE attendances SET clock_out = $1, status = $2, notes = $3, updated_at = CURRENT_TIMESTAMP ` + activeCond
		res, err := r.db.Exec(query, clockOutTime, *status, *notes, employeeID, date)
		if err == nil {
			if aff, _ := res.RowsAffected(); aff > 0 {
				return nil
			}
		}
	} else if status != nil && *status != "" {
		query := `UPDATE attendances SET clock_out = $1, status = $2, updated_at = CURRENT_TIMESTAMP ` + activeCond
		res, err := r.db.Exec(query, clockOutTime, *status, employeeID, date)
		if err == nil {
			if aff, _ := res.RowsAffected(); aff > 0 {
				return nil
			}
		}
	} else if notes != nil && *notes != "" {
		query := `UPDATE attendances SET clock_out = $1, notes = $2, updated_at = CURRENT_TIMESTAMP ` + activeCond
		res, err := r.db.Exec(query, clockOutTime, *notes, employeeID, date)
		if err == nil {
			if aff, _ := res.RowsAffected(); aff > 0 {
				return nil
			}
		}
	}
	return r.CheckOut(employeeID, date, clockOutTime)
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

func parseClockMinutes(tStr string) int {
	if len(tStr) >= 5 {
		if strings.Contains(tStr, "T") {
			parts := strings.Split(tStr, "T")
			if len(parts) > 1 {
				tStr = parts[1]
			}
		}
		parts := strings.Split(tStr, ":")
		if len(parts) >= 2 {
			h, _ := strconv.Atoi(parts[0])
			m, _ := strconv.Atoi(parts[1])
			return h*60 + m
		}
	}
	return 0
}

// GetMatchingWorkSchedule finds the appropriate shift for an employee on a given date and time, excluding already attended shifts.
func (r *AttendanceRepository) GetMatchingWorkSchedule(employeeID int, date string, currentTime string) (clockInTime string, lateTolerance int, workScheduleID *int, found bool) {
	// 0. If employee is on approved leave on this date, no working schedule applies
	var leaveCount int
	_ = r.db.Get(&leaveCount, `
		SELECT COUNT(*)
		FROM leaves l
		JOIN employees e ON (l.employee_id = e.id OR l.employee_id = e.user_id)
		WHERE (e.id = $1 OR e.user_id = $1)
		  AND l.status = 'approved'
		  AND l.start_date::date <= $2::date AND l.end_date::date >= $2::date
		  AND l.deleted_at IS NULL
	`, employeeID, date)
	if leaveCount > 0 {
		return "", 0, nil, false
	}

	type ShiftResult struct {
		ClockInTime    string `db:"clock_in_time"`
		LateTolerance  int    `db:"late_tolerance"`
		WorkScheduleID int    `db:"work_schedule_id"`
	}

	// 1. Get all roster schedules for this employee on date
	var rosterShifts []ShiftResult
	queryRoster := `
		SELECT ws.clock_in_time::text, ws.late_tolerance, ws.id as work_schedule_id
		FROM roster_schedules rs
		JOIN work_schedules ws ON rs.work_schedule_id = ws.id
		JOIN employees e ON (rs.employee_id = e.user_id OR rs.employee_id = e.id)
		WHERE (e.id = $1 OR e.user_id = $1)
		  AND rs.date = $2::date
		  AND ws.deleted_at IS NULL
		ORDER BY ws.clock_in_time ASC
	`
	_ = r.db.Select(&rosterShifts, queryRoster, employeeID, date)

	// Fetch already completed/attended work_schedule_ids today
	completedMap := make(map[int]bool)
	if completedIDs, err := r.GetCompletedWorkScheduleIDs(employeeID, date); err == nil {
		for _, id := range completedIDs {
			completedMap[id] = true
		}
	}

	// Filter out shifts already completed today
	var candidateShifts []ShiftResult
	for _, s := range rosterShifts {
		if !completedMap[s.WorkScheduleID] {
			candidateShifts = append(candidateShifts, s)
		}
	}

	// If there are candidate shifts from roster:
	if len(candidateShifts) > 0 {
		if len(candidateShifts) == 1 || currentTime == "" {
			wsID := candidateShifts[0].WorkScheduleID
			return candidateShifts[0].ClockInTime, candidateShifts[0].LateTolerance, &wsID, true
		}

		// Find the shift closest to currentTime
		currMins := parseClockMinutes(currentTime)
		bestIdx := 0
		minDiff := 99999
		for i, s := range candidateShifts {
			sMins := parseClockMinutes(s.ClockInTime)
			diff := int(math.Abs(float64(currMins - sMins)))
			if diff < minDiff {
				minDiff = diff
				bestIdx = i
			}
		}
		wsID := candidateShifts[bestIdx].WorkScheduleID
		return candidateShifts[bestIdx].ClockInTime, candidateShifts[bestIdx].LateTolerance, &wsID, true
	}

	// If roster shifts exist but all are already completed:
	if len(rosterShifts) > 0 {
		return "", 0, nil, false
	}

	// 2. Check employee_schedules for weekday shift
	t, parseErr := time.Parse("2006-01-02", date)
	if parseErr == nil {
		weekday := t.Weekday() // Sunday = 0, Monday = 1, ...
		shiftCol := ""
		switch weekday {
		case time.Monday:
			shiftCol = "es.monday_shift_id"
		case time.Tuesday:
			shiftCol = "es.tuesday_shift_id"
		case time.Wednesday:
			shiftCol = "es.wednesday_shift_id"
		case time.Thursday:
			shiftCol = "es.thursday_shift_id"
		case time.Friday:
			shiftCol = "es.friday_shift_id"
		case time.Saturday:
			shiftCol = "es.saturday_shift_id"
		case time.Sunday:
			shiftCol = "es.sunday_shift_id"
		}

		if shiftCol != "" {
			queryES := fmt.Sprintf(`
				SELECT ws.clock_in_time::text, ws.late_tolerance, ws.id as work_schedule_id
				FROM employee_schedules es
				JOIN work_schedules ws ON %s = ws.id
				JOIN employees e ON (es.user_id = e.user_id OR es.user_id = e.id)
				WHERE (e.id = $1 OR e.user_id = $1)
				  AND (es.start_date::date <= $2::date)
				  AND (es.end_date IS NULL OR es.end_date::date >= $2::date)
				  AND ws.deleted_at IS NULL
				LIMIT 1
			`, shiftCol)

			var esResult ShiftResult
			if errES := r.db.Get(&esResult, queryES, employeeID, date); errES == nil {
				// Check if this regular shift was already completed today
				if completedMap[esResult.WorkScheduleID] {
					return "", 0, nil, false
				}
				wsID := esResult.WorkScheduleID
				return esResult.ClockInTime, esResult.LateTolerance, &wsID, true
			}
		}
	}

	// 3. If neither roster nor employee schedule exists for this employee on date:
	// They have NO SCHEDULE today (Hari Libur)! Do NOT invent a fake fallback schedule!
	return "", 0, nil, false
}

func (r *AttendanceRepository) GetWorkScheduleForEmployee(employeeID int, date string) (clockInTime string, lateTolerance int, workScheduleID *int, found bool) {
	return r.GetMatchingWorkSchedule(employeeID, date, "")
}

type TodayScheduleInfo struct {
	IsDayOff         bool                `json:"is_day_off"`
	IsOnLeave        bool                `json:"is_on_leave"`
	LeaveName        string              `json:"leave_name"`
	HasActiveSession bool                `json:"has_active_session"`
	AllCompleted     bool                `json:"all_completed"`
	CanCheckIn       bool                `json:"can_check_in"`
	CanCheckOut      bool                `json:"can_check_out"`
	CompletedCount   int                 `json:"completed_count"`
	ShiftName        string              `json:"shift_name"`
	ClockInTime      string              `json:"clock_in_time"`
	ClockOutTime     string              `json:"clock_out_time"`
	WorkScheduleID   *int                `json:"work_schedule_id"`
	LateTolerance    int                 `json:"late_tolerance"`
	Message          string              `json:"message"`
	ActiveAttendance *models.Attendance  `json:"active_attendance"`
}

func (r *AttendanceRepository) GetTodayScheduleInfo(employeeID int, date string, currentTime string) *TodayScheduleInfo {
	info := &TodayScheduleInfo{
		IsDayOff:         false,
		IsOnLeave:        false,
		LeaveName:        "",
		HasActiveSession: false,
		AllCompleted:     false,
		CanCheckIn:       false,
		CanCheckOut:      false,
		CompletedCount:   0,
		ShiftName:        "-",
	}

	// 0. Check if employee is on approved leave today
	var activeLeave struct {
		ID            int    `db:"id"`
		Reason        string `db:"reason"`
		LeaveTypeName string `db:"leave_type_name"`
	}
	errLeave := r.db.Get(&activeLeave, `
		SELECT l.id, l.reason, COALESCE(lt.name, 'Cuti') as leave_type_name
		FROM leaves l
		LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
		JOIN employees e ON (l.employee_id = e.id OR l.employee_id = e.user_id)
		WHERE (e.id = $1 OR e.user_id = $1)
		  AND l.status = 'approved'
		  AND l.start_date::date <= $2::date AND l.end_date::date >= $2::date
		  AND l.deleted_at IS NULL
		LIMIT 1
	`, employeeID, date)
	if errLeave == nil && activeLeave.ID > 0 {
		info.IsOnLeave = true
		info.IsDayOff = true
		info.CanCheckIn = false
		info.LeaveName = activeLeave.LeaveTypeName
		info.ShiftName = "Cuti (" + activeLeave.LeaveTypeName + ")"
		info.Message = "Sedang Cuti: " + activeLeave.LeaveTypeName
		return info
	}

	// 1. Check active open session
	activeAtt, _ := r.GetActiveAttendanceForEmployee(employeeID, date)
	if activeAtt != nil {
		info.HasActiveSession = true
		info.CanCheckOut = true
		info.ActiveAttendance = activeAtt
		info.WorkScheduleID = activeAtt.WorkScheduleID
		if activeAtt.WorkScheduleID != nil {
			var ws models.WorkSchedule
			if err := r.db.Get(&ws, "SELECT name, clock_in_time::text, clock_out_time::text, late_tolerance FROM work_schedules WHERE id = $1", *activeAtt.WorkScheduleID); err == nil {
				info.ShiftName = ws.Name
				info.ClockInTime = ws.ClockInTime
				info.ClockOutTime = ws.ClockOutTime
				info.LateTolerance = ws.LateTolerance
			}
		}
		info.Message = "Sesi Berjalan"
		return info
	}

	// 2. Count completed sessions today
	info.CompletedCount = r.GetCompletedAttendanceCount(employeeID, date)

	// 3. Check matching schedule
	shiftStart, tolerance, autoWSID, found := r.GetMatchingWorkSchedule(employeeID, date, currentTime)
	if found {
		info.CanCheckIn = true
		info.WorkScheduleID = autoWSID
		info.ClockInTime = shiftStart
		info.LateTolerance = tolerance
		if autoWSID != nil {
			var wsName string
			var clockOut string
			_ = r.db.Get(&wsName, "SELECT name FROM work_schedules WHERE id = $1", *autoWSID)
			_ = r.db.Get(&clockOut, "SELECT clock_out_time::text FROM work_schedules WHERE id = $1", *autoWSID)
			info.ShiftName = wsName
			info.ClockOutTime = clockOut
		}
		if info.CompletedCount > 0 {
			info.Message = "Masuk Shift Berikutnya"
		} else {
			info.Message = "Siap Presensi Masuk"
		}
		return info
	}

	// 4. Not found -> check if employee has ANY schedule for today to determine whether it's Day Off or All Completed
	var rosterCount int
	_ = r.db.Get(&rosterCount, `
		SELECT COUNT(*)
		FROM roster_schedules rs
		JOIN work_schedules ws ON rs.work_schedule_id = ws.id
		JOIN employees e ON (rs.employee_id = e.user_id OR rs.employee_id = e.id)
		WHERE (e.id = $1 OR e.user_id = $1)
		  AND rs.date = $2::date
		  AND ws.deleted_at IS NULL
	`, employeeID, date)

	var regularScheduleCount int
	t, parseErr := time.Parse("2006-01-02", date)
	if parseErr == nil {
		weekday := t.Weekday()
		shiftCol := ""
		switch weekday {
		case time.Monday:
			shiftCol = "es.monday_shift_id"
		case time.Tuesday:
			shiftCol = "es.tuesday_shift_id"
		case time.Wednesday:
			shiftCol = "es.wednesday_shift_id"
		case time.Thursday:
			shiftCol = "es.thursday_shift_id"
		case time.Friday:
			shiftCol = "es.friday_shift_id"
		case time.Saturday:
			shiftCol = "es.saturday_shift_id"
		case time.Sunday:
			shiftCol = "es.sunday_shift_id"
		}
		if shiftCol != "" {
			queryESCount := fmt.Sprintf(`
				SELECT COUNT(*)
				FROM employee_schedules es
				JOIN work_schedules ws ON %s = ws.id
				JOIN employees e ON (es.user_id = e.user_id OR es.user_id = e.id)
				WHERE (e.id = $1 OR e.user_id = $1)
				  AND (es.start_date::date <= $2::date)
				  AND (es.end_date IS NULL OR es.end_date::date >= $2::date)
				  AND ws.deleted_at IS NULL
			`, shiftCol)
			_ = r.db.Get(&regularScheduleCount, queryESCount, employeeID, date)
		}
	}

	totalScheduled := rosterCount + regularScheduleCount
	if totalScheduled > 0 && info.CompletedCount > 0 {
		info.AllCompleted = true
		info.ShiftName = "Presensi Selesai"
		info.Message = "Semua shift hari ini telah selesai"
	} else {
		info.IsDayOff = true
		info.ShiftName = "Hari Libur"
		info.Message = "Hari ini Anda libur (tidak ada jadwal shift)"
	}

	return info
}
