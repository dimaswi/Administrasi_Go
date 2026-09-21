package repository

import (
	"backend/models"
	"time"

	"github.com/jmoiron/sqlx"
)

type ShiftExchangeRepository interface {
	Create(exchange *models.ShiftExchange) error
	GetAll() ([]models.ShiftExchange, error)
	GetByID(id int) (*models.ShiftExchange, error)
	UpdateStatus(id int, status string, approvedBy *int) error
}

type shiftExchangeRepository struct {
	db *sqlx.DB
}

func NewShiftExchangeRepository(db *sqlx.DB) ShiftExchangeRepository {
	return &shiftExchangeRepository{db: db}
}

func (r *shiftExchangeRepository) Create(exchange *models.ShiftExchange) error {
	query := `
		INSERT INTO shift_exchanges (
			requesting_employee_id, target_employee_id, original_roster_id, target_roster_id, status, reason, created_at, updated_at
		) VALUES (
			:requesting_employee_id, :target_employee_id, :original_roster_id, :target_roster_id, 'pending', :reason, :created_at, :updated_at
		) RETURNING id
	`
	exchange.CreatedAt = time.Now()
	exchange.UpdatedAt = time.Now()
	
	rows, err := r.db.NamedQuery(query, exchange)
	if err != nil {
		return err
	}
	defer rows.Close()

	if rows.Next() {
		err = rows.Scan(&exchange.ID)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *shiftExchangeRepository) GetAll() ([]models.ShiftExchange, error) {
	var exchanges []models.ShiftExchange
	err := r.db.Select(&exchanges, "SELECT * FROM shift_exchanges ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	return exchanges, nil
}

func (r *shiftExchangeRepository) GetByID(id int) (*models.ShiftExchange, error) {
	var exchange models.ShiftExchange
	err := r.db.Get(&exchange, "SELECT * FROM shift_exchanges WHERE id = $1", id)
	if err != nil {
		return nil, err
	}
	return &exchange, nil
}

func (r *shiftExchangeRepository) UpdateStatus(id int, status string, approvedBy *int) error {
	query := `
		UPDATE shift_exchanges 
		SET status = $1, approved_by = $2, approved_at = $3, updated_at = $4 
		WHERE id = $5
	`
	now := time.Now()
	_, err := r.db.Exec(query, status, approvedBy, now, now, id)
	return err
}
