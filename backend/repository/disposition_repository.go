package repository

import (
	"context"
	"database/sql"
	"github.com/jmoiron/sqlx"
	"backend/models"
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
