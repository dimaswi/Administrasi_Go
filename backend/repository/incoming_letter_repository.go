package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
	"backend/models"
)

type IncomingLetterRepository struct {
	db *sqlx.DB
}

func NewIncomingLetterRepository(db *sqlx.DB) *IncomingLetterRepository {
	return &IncomingLetterRepository{db: db}
}

func (r *IncomingLetterRepository) GetPaginated(ctx context.Context, limit, offset int, search, status, category, classification, dateFrom, dateTo string) ([]models.IncomingLetter, int, error) {
	var letters []models.IncomingLetter
	var total int

	query := `SELECT id, incoming_number, original_number, original_date, received_date, sender, subject, category, classification, attachment_count, attachment_description, file_path, organization_unit_id, registered_by, status, notes, created_at, updated_at, deleted_at FROM incoming_letters WHERE deleted_at IS NULL`
	countQuery := `SELECT COUNT(*) FROM incoming_letters WHERE deleted_at IS NULL`

	var args []interface{}
	var conditions []string
	argID := 1

	if search != "" {
		conditions = append(conditions, fmt.Sprintf("(incoming_number ILIKE $%d OR subject ILIKE $%d OR sender ILIKE $%d)", argID, argID, argID))
		args = append(args, "%"+search+"%")
		argID++
	}

	if status != "" {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argID))
		args = append(args, status)
		argID++
	}

	if category != "" {
		conditions = append(conditions, fmt.Sprintf("category = $%d", argID))
		args = append(args, category)
		argID++
	}

	if classification != "" {
		conditions = append(conditions, fmt.Sprintf("classification = $%d", argID))
		args = append(args, classification)
		argID++
	}

	if dateFrom != "" {
		conditions = append(conditions, fmt.Sprintf("received_date >= $%d", argID))
		args = append(args, dateFrom)
		argID++
	}

	if dateTo != "" {
		conditions = append(conditions, fmt.Sprintf("received_date <= $%d", argID))
		args = append(args, dateTo)
		argID++
	}

	if len(conditions) > 0 {
		whereClause := " AND " + strings.Join(conditions, " AND ")
		query += whereClause
		countQuery += whereClause
	}

	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query += fmt.Sprintf(" ORDER BY received_date DESC LIMIT $%d OFFSET $%d", argID, argID+1)
	args = append(args, limit, offset)

	err = r.db.SelectContext(ctx, &letters, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return letters, total, nil
}

func (r *IncomingLetterRepository) Create(ctx context.Context, letter *models.IncomingLetter) error {
	query := `
		INSERT INTO incoming_letters (
			incoming_number, original_number, original_date, received_date, sender, subject, category, classification, attachment_count, attachment_description, file_path, organization_unit_id, registered_by, status, notes, created_at, updated_at
		) VALUES (
			:incoming_number, :original_number, :original_date, :received_date, :sender, :subject, :category, :classification, :attachment_count, :attachment_description, :file_path, :organization_unit_id, :registered_by, :status, :notes, NOW(), NOW()
		) RETURNING id, created_at, updated_at
	`
	stmt, err := r.db.PrepareNamedContext(ctx, query)
	if err != nil {
		return err
	}
	defer stmt.Close()

	return stmt.GetContext(ctx, letter, letter)
}

func (r *IncomingLetterRepository) GetByID(ctx context.Context, id int64) (*models.IncomingLetter, error) {
	var letter models.IncomingLetter
	query := `SELECT * FROM incoming_letters WHERE id = $1 AND deleted_at IS NULL`
	err := r.db.GetContext(ctx, &letter, query, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &letter, nil
}

func (r *IncomingLetterRepository) Update(ctx context.Context, letter *models.IncomingLetter) error {
	query := `
		UPDATE incoming_letters SET
			incoming_number = :incoming_number,
			original_number = :original_number,
			original_date = :original_date,
			received_date = :received_date,
			sender = :sender,
			subject = :subject,
			category = :category,
			classification = :classification,
			attachment_count = :attachment_count,
			attachment_description = :attachment_description,
			file_path = :file_path,
			organization_unit_id = :organization_unit_id,
			status = :status,
			notes = :notes,
			updated_at = NOW()
		WHERE id = :id AND deleted_at IS NULL
		RETURNING updated_at
	`
	stmt, err := r.db.PrepareNamedContext(ctx, query)
	if err != nil {
		return err
	}
	defer stmt.Close()

	return stmt.GetContext(ctx, letter, letter)
}

func (r *IncomingLetterRepository) Delete(ctx context.Context, id int64) error {
	query := `UPDATE incoming_letters SET deleted_at = NOW() WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}
