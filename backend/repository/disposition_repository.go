package repository

import (
	"backend/models"
	"context"
	"database/sql"
	"strconv"

	"github.com/jmoiron/sqlx"
)

type DispositionRepository struct {
	db *sqlx.DB
}

func NewDispositionRepository(db *sqlx.DB) *DispositionRepository {
	return &DispositionRepository{db: db}
}

func (r *DispositionRepository) GetByLetterID(ctx context.Context, letterID int64) ([]models.Disposition, error) {
	var dispositions []models.Disposition
	query := `SELECT * FROM dispositions WHERE incoming_letter_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`
	err := r.db.SelectContext(ctx, &dispositions, query, letterID)
	return dispositions, err
}

func (r *DispositionRepository) Create(ctx context.Context, disposition *models.Disposition) error {
	query := `
		INSERT INTO dispositions (
			incoming_letter_id, parent_disposition_id, from_user_id, to_user_id, instruction, notes, priority, deadline, status, created_at, updated_at
		) VALUES (
			:incoming_letter_id, :parent_disposition_id, :from_user_id, :to_user_id, :instruction, :notes, :priority, :deadline, :status, NOW(), NOW()
		) RETURNING id, created_at, updated_at
	`
	stmt, err := r.db.PrepareNamedContext(ctx, query)
	if err != nil {
		return err
	}
	defer stmt.Close()

	return stmt.GetContext(ctx, disposition, disposition)
}

func (r *DispositionRepository) UpdateStatus(ctx context.Context, id int64, status string) error {
	query := `UPDATE dispositions SET status = $1, updated_at = NOW()`

	if status == "read" {
		query += `, read_at = COALESCE(read_at, NOW())`
	} else if status == "completed" {
		query += `, completed_at = NOW()`
	}

	query += ` WHERE id = $2`

	_, err := r.db.ExecContext(ctx, query, status, id)
	return err
}

func (r *DispositionRepository) GetByID(ctx context.Context, id int64) (*models.Disposition, error) {
	var disposition models.Disposition
	query := `SELECT * FROM dispositions WHERE id = $1 AND deleted_at IS NULL`
	err := r.db.GetContext(ctx, &disposition, query, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &disposition, nil
}

func (r *DispositionRepository) GetMyDispositions(ctx context.Context, userID int64, limit, offset int, status, priority string) ([]models.DispositionWithDetails, int, error) {
	var dispositions []models.DispositionWithDetails
	var total int

	query := `
		SELECT 
			d.*,
			u.name AS from_user_name,
			il.incoming_number AS incoming_number,
			il.subject AS incoming_subject,
			il.sender AS incoming_sender,
			il.received_date AS incoming_received_date,
			il.classification AS incoming_classification
		FROM dispositions d
		JOIN users u ON d.from_user_id = u.id
		JOIN incoming_letters il ON d.incoming_letter_id = il.id
		WHERE d.to_user_id = $1 AND d.deleted_at IS NULL
	`
	countQuery := `SELECT COUNT(*) FROM dispositions d WHERE d.to_user_id = $1 AND d.deleted_at IS NULL`

	var args []interface{}
	args = append(args, userID)
	argID := 2

	if status != "" {
		query += " AND d.status = $" + strconv.Itoa(argID)
		countQuery += " AND d.status = $" + strconv.Itoa(argID)
		args = append(args, status)
		argID++
	}

	if priority != "" {
		query += " AND d.priority = $" + strconv.Itoa(argID)
		countQuery += " AND d.priority = $" + strconv.Itoa(argID)
		args = append(args, priority)
		argID++
	}

	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query += " ORDER BY d.created_at DESC LIMIT $" + strconv.Itoa(argID) + " OFFSET $" + strconv.Itoa(argID+1)
	args = append(args, limit, offset)

	err = r.db.SelectContext(ctx, &dispositions, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return dispositions, total, nil
}
