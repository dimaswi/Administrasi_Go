package repository

import (
	"backend/models"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type DocumentTemplateRepository struct {
	DB *sqlx.DB
}

func NewDocumentTemplateRepository(db *sqlx.DB) *DocumentTemplateRepository {
	return &DocumentTemplateRepository{DB: db}
}

func (r *DocumentTemplateRepository) GetAll(page, perPage int, search string) ([]models.DocumentTemplate, map[string]interface{}, error) {
	var templates []models.DocumentTemplate
	var total int

	offset := (page - 1) * perPage

	queryCount := "SELECT COUNT(*) FROM document_templates WHERE deleted_at IS NULL"
	querySelect := `
		SELECT dt.*, ou.name as organization_unit_name 
		FROM document_templates dt
		LEFT JOIN organization_units ou ON dt.organization_unit_id = ou.id
		WHERE dt.deleted_at IS NULL
	`

	var args []interface{}
	if search != "" {
		searchTerm := "%" + search + "%"
		whereClause := " AND (dt.name ILIKE $1 OR dt.code ILIKE $2)"
		queryCount += whereClause
		querySelect += whereClause
		args = append(args, searchTerm, searchTerm)
	}

	// Count total
	if err := r.DB.Get(&total, queryCount, args...); err != nil {
		return nil, nil, err
	}

	// Fetch data
	querySelect += fmt.Sprintf(" ORDER BY dt.id DESC LIMIT $%d OFFSET $%d", len(args)+1, len(args)+2)
	args = append(args, perPage, offset)

	if err := r.DB.Select(&templates, querySelect, args...); err != nil {
		return nil, nil, err
	}

	lastPage := (total + perPage - 1) / perPage
	paginationMeta := map[string]interface{}{
		"current_page": page,
		"last_page":    lastPage,
		"per_page":     perPage,
		"total":        total,
	}

	return templates, paginationMeta, nil
}

func (r *DocumentTemplateRepository) GetByID(id int) (*models.DocumentTemplate, error) {
	var template models.DocumentTemplate
	query := `
		SELECT dt.*, ou.name as organization_unit_name 
		FROM document_templates dt
		LEFT JOIN organization_units ou ON dt.organization_unit_id = ou.id
		WHERE dt.id = $1
	`
	err := r.DB.Get(&template, query, id)
	if err != nil {
		return nil, err
	}
	return &template, nil
}

// TODO: Implement Create, Update, Delete if necessary for admin functionality
