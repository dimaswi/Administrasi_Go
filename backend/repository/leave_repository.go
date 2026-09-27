package repository

import (
	"backend/models"
	"math"
	"strconv"

	"github.com/jmoiron/sqlx"
)

type LeaveRepository struct {
	db *sqlx.DB
}

func NewLeaveRepository(db *sqlx.DB) *LeaveRepository {
	return &LeaveRepository{db: db}
}

func (r *LeaveRepository) GetAll(page int, perPage int, search string, employeeID int) (models.PaginatedResponse, error) {
	var leaves []models.Leave

	offset := (page - 1) * perPage

	query := `
		SELECT l.id, l.employee_id, l.leave_type_id, 
		       l.start_date::text as start_date, 
		       l.end_date::text as end_date, 
		       l.total_days, 
		       l.is_half_day, l.half_day_type, l.reason, l.attachment, l.emergency_contact, 
		       l.emergency_phone, l.delegation_to, l.status, l.approved_by, l.approved_at, 
		       l.approval_notes, l.approved_by_level_2, l.approved_at_level_2, l.approval_notes_level_2, 
		       l.created_by, l.updated_by, l.submitted_at, l.cancelled_at, l.cancellation_reason, 
		       l.created_at, l.updated_at, l.deleted_at, 
		       TRIM(COALESCE(e.first_name, '') || ' ' || COALESCE(e.last_name, '')) as employee_name, 
		       COALESCE(lt.name, 'Cuti') as leave_type_name,
		       TRIM(COALESCE(del.first_name, '') || ' ' || COALESCE(del.last_name, '')) as delegation_to_name
		FROM leaves l
		LEFT JOIN employees e ON l.employee_id = e.id
		LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
		LEFT JOIN employees del ON l.delegation_to = del.id
		WHERE l.deleted_at IS NULL
	`
	countQuery := `
		SELECT COUNT(*) 
		FROM leaves l
		LEFT JOIN employees e ON l.employee_id = e.id
		LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
		WHERE l.deleted_at IS NULL
	`

	args := []interface{}{}
	argId := 1

	if employeeID > 0 {
		query += " AND l.employee_id = $" + strconv.Itoa(argId)
		countQuery += " AND l.employee_id = $" + strconv.Itoa(argId)
		args = append(args, employeeID)
		argId++
	}

	if search != "" {
		query += " AND (e.first_name ILIKE $" + strconv.Itoa(argId) + " OR e.last_name ILIKE $" + strconv.Itoa(argId) + " OR (e.first_name || ' ' || COALESCE(e.last_name, '')) ILIKE $" + strconv.Itoa(argId) + " OR e.employee_id ILIKE $" + strconv.Itoa(argId) + " OR l.reason ILIKE $" + strconv.Itoa(argId) + ")"
		countQuery += " AND (e.first_name ILIKE $" + strconv.Itoa(argId) + " OR e.last_name ILIKE $" + strconv.Itoa(argId) + " OR (e.first_name || ' ' || COALESCE(e.last_name, '')) ILIKE $" + strconv.Itoa(argId) + " OR e.employee_id ILIKE $" + strconv.Itoa(argId) + " OR l.reason ILIKE $" + strconv.Itoa(argId) + ")"
		args = append(args, "%"+search+"%")
		argId++
	}

	var total int
	err := r.db.Get(&total, countQuery, args...)
	if err != nil {
		return models.PaginatedResponse{}, err
	}

	query += " ORDER BY l.id DESC LIMIT $" + strconv.Itoa(argId) + " OFFSET $" + strconv.Itoa(argId+1)
	args = append(args, perPage, offset)

	err = r.db.Select(&leaves, query, args...)
	if err != nil {
		return models.PaginatedResponse{}, err
	}

	if leaves == nil {
		leaves = []models.Leave{}
	}

	lastPage := int(math.Ceil(float64(total) / float64(perPage)))
	if lastPage == 0 {
		lastPage = 1
	}

	from := offset + 1
	if total == 0 {
		from = 0
	}
	to := offset + len(leaves)

	return models.PaginatedResponse{
		Data: leaves,
		PaginationMeta: models.PaginationMeta{
			CurrentPage: page,
			LastPage:    lastPage,
			PerPage:     perPage,
			Total:       total,
			From:        from,
			To:          to,
		},
	}, nil
}

func (r *LeaveRepository) GetByID(id int) (*models.Leave, error) {
	var leave models.Leave
	query := `
		SELECT l.id, l.employee_id, l.leave_type_id, 
		       l.start_date::text as start_date, 
		       l.end_date::text as end_date, 
		       l.total_days, 
		       l.is_half_day, l.half_day_type, l.reason, l.attachment, l.emergency_contact, 
		       l.emergency_phone, l.delegation_to, l.status, l.approved_by, l.approved_at, 
		       l.approval_notes, l.approved_by_level_2, l.approved_at_level_2, l.approval_notes_level_2, 
		       l.created_by, l.updated_by, l.submitted_at, l.cancelled_at, l.cancellation_reason, 
		       l.created_at, l.updated_at, l.deleted_at, 
		       TRIM(COALESCE(e.first_name, '') || ' ' || COALESCE(e.last_name, '')) as employee_name, 
		       COALESCE(lt.name, 'Cuti') as leave_type_name,
		       TRIM(COALESCE(del.first_name, '') || ' ' || COALESCE(del.last_name, '')) as delegation_to_name
		FROM leaves l
		LEFT JOIN employees e ON l.employee_id = e.id
		LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
		LEFT JOIN employees del ON l.delegation_to = del.id
		WHERE l.id = $1 AND l.deleted_at IS NULL
	`
	err := r.db.Get(&leave, query, id)
	return &leave, err
}

func (r *LeaveRepository) UpdateStatus(id int, status string, notes string, approvedBy int) error {
	query := `
		UPDATE leaves 
		SET status = $1, approval_notes = $2, approved_by = $3, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
	`
	_, err := r.db.Exec(query, status, notes, approvedBy, id)
	return err
}

func (r *LeaveRepository) Create(leave *models.Leave) error {
	// Defensive check: ensure leave_type_id is valid
	if leave.LeaveTypeID <= 0 {
		var firstID int
		if err := r.db.Get(&firstID, "SELECT id FROM leave_types ORDER BY sort_order ASC, id ASC LIMIT 1"); err == nil && firstID > 0 {
			leave.LeaveTypeID = firstID
		}
	} else {
		var exists bool
		if err := r.db.Get(&exists, "SELECT EXISTS(SELECT 1 FROM leave_types WHERE id = $1)", leave.LeaveTypeID); err == nil && !exists {
			var firstID int
			if errFallback := r.db.Get(&firstID, "SELECT id FROM leave_types ORDER BY sort_order ASC, id ASC LIMIT 1"); errFallback == nil && firstID > 0 {
				leave.LeaveTypeID = firstID
			}
		}
	}

	query := `
		INSERT INTO leaves (
			employee_id, leave_type_id, start_date, end_date, total_days, 
			is_half_day, reason, emergency_contact, emergency_phone, delegation_to, status, 
			created_at, updated_at
		) VALUES (
			:employee_id, :leave_type_id, :start_date, :end_date, :total_days, 
			:is_half_day, :reason, :emergency_contact, :emergency_phone, :delegation_to, :status, 
			CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
		) RETURNING id, created_at, updated_at
	`
	rows, err := r.db.NamedQuery(query, leave)
	if err != nil {
		return err
	}
	defer rows.Close()

	if rows.Next() {
		return rows.Scan(&leave.ID, &leave.CreatedAt, &leave.UpdatedAt)
	}
	return nil
}

