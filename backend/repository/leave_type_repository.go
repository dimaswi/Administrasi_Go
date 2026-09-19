package repository

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type LeaveTypeRepository struct {
	db *sqlx.DB
}

func NewLeaveTypeRepository(db *sqlx.DB) *LeaveTypeRepository {
	return &LeaveTypeRepository{db: db}
}

func (r *LeaveTypeRepository) GetAll() ([]models.LeaveType, error) {
	types := []models.LeaveType{}
	err := r.db.Select(&types, "SELECT * FROM leave_types WHERE deleted_at IS NULL ORDER BY sort_order")
	return types, err
}

func (r *LeaveTypeRepository) GetByID(id int) (*models.LeaveType, error) {
	var leaveType models.LeaveType
	err := r.db.Get(&leaveType, "SELECT * FROM leave_types WHERE id = $1 AND deleted_at IS NULL", id)
	return &leaveType, err
}

func (r *LeaveTypeRepository) Create(leaveType *models.LeaveType) error {
	query := `
		INSERT INTO leave_types (code, name, description, default_quota, is_paid, requires_approval, allow_carry_over, max_carry_over_days, min_advance_days, max_consecutive_days, is_active, sort_order, color, created_at, updated_at)
		VALUES (:code, :name, :description, :default_quota, :is_paid, :requires_approval, :allow_carry_over, :max_carry_over_days, :min_advance_days, :max_consecutive_days, :is_active, :sort_order, :color, :created_at, :updated_at)
		RETURNING id
	`
	rows, err := r.db.NamedQuery(query, leaveType)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&leaveType.ID)
	}
	return nil
}

func (r *LeaveTypeRepository) Update(leaveType *models.LeaveType) error {
	query := `
		UPDATE leave_types 
		SET code = :code, name = :name, description = :description, default_quota = :default_quota, is_paid = :is_paid, requires_approval = :requires_approval, allow_carry_over = :allow_carry_over, max_carry_over_days = :max_carry_over_days, min_advance_days = :min_advance_days, max_consecutive_days = :max_consecutive_days, is_active = :is_active, sort_order = :sort_order, color = :color, updated_at = :updated_at
		WHERE id = :id AND deleted_at IS NULL
	`
	_, err := r.db.NamedExec(query, leaveType)
	return err
}

func (r *LeaveTypeRepository) Delete(id int) error {
	_, err := r.db.Exec("UPDATE leave_types SET deleted_at = NOW() WHERE id = $1", id)
	return err
}
