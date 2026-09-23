package repository

import (
	"backend/models"
	"fmt"
	"time"

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

	queryCount := "SELECT COUNT(*) FROM document_templates dt WHERE dt.deleted_at IS NULL"
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

	if err := r.DB.Get(&total, queryCount, args...); err != nil {
		return nil, nil, err
	}

	querySelect += fmt.Sprintf(" ORDER BY dt.id DESC LIMIT $%d OFFSET $%d", len(args)+1, len(args)+2)
	args = append(args, perPage, offset)

	if err := r.DB.Select(&templates, querySelect, args...); err != nil {
		return nil, nil, err
	}

	if templates == nil {
		templates = []models.DocumentTemplate{}
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
		WHERE dt.id = $1 AND dt.deleted_at IS NULL
	`
	err := r.DB.Get(&template, query, id)
	if err != nil {
		return nil, err
	}
	return &template, nil
}

func (r *DocumentTemplateRepository) Create(t *models.DocumentTemplate) error {
	query := `
		INSERT INTO document_templates (
			name, code, category, template_type, organization_unit_id, description,
			page_settings, header_settings, content_blocks, footer_settings, signature_settings,
			variables, numbering_format, numbering_group_id, is_active, created_by, created_at, updated_at
		) VALUES (
			:name, :code, :category, :template_type, :organization_unit_id, :description,
			:page_settings, :header_settings, :content_blocks, :footer_settings, :signature_settings,
			:variables, :numbering_format, :numbering_group_id, :is_active, :created_by, :created_at, :updated_at
		) RETURNING id
	`
	
	t.CreatedAt = time.Now()
	t.UpdatedAt = time.Now()
	
	rows, err := r.DB.NamedQuery(query, t)
	if err != nil {
		return err
	}
	defer rows.Close()

	if rows.Next() {
		err = rows.Scan(&t.ID)
		if err != nil {
			return err
		}
	}

	// Update numbering group ID if not set (own numbering)
	if t.NumberingGroupID == nil {
		_, err = r.DB.Exec("UPDATE document_templates SET numbering_group_id = $1 WHERE id = $1", t.ID)
		t.NumberingGroupID = &t.ID
	}
	
	return err
}

func (r *DocumentTemplateRepository) Update(t *models.DocumentTemplate) error {
	query := `
		UPDATE document_templates SET
			name = :name,
			code = :code,
			category = :category,
			template_type = :template_type,
			organization_unit_id = :organization_unit_id,
			description = :description,
			page_settings = :page_settings,
			header_settings = :header_settings,
			content_blocks = :content_blocks,
			footer_settings = :footer_settings,
			signature_settings = :signature_settings,
			variables = :variables,
			numbering_format = :numbering_format,
			is_active = :is_active,
			updated_by = :updated_by,
			updated_at = :updated_at
		WHERE id = :id AND deleted_at IS NULL
	`
	t.UpdatedAt = time.Now()
	_, err := r.DB.NamedExec(query, t)
	return err
}

func (r *DocumentTemplateRepository) Delete(id int) error {
	_, err := r.DB.Exec("UPDATE document_templates SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1", id)
	return err
}
