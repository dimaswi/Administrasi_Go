package repository

import (
	"backend/models"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type KpiRepository struct {
	db *sqlx.DB
}

func NewKpiRepository(db *sqlx.DB) *KpiRepository {
	return &KpiRepository{db: db}
}

// --- Categories ---

func (r *KpiRepository) GetAllCategories() ([]models.KpiCategory, error) {
	categories := []models.KpiCategory{}
	query := `
		SELECT 
			c.id, c.name, c.code, c.description, c.weight, c.sort_order, c.is_active, c.created_at, c.updated_at,
			COALESCE(COUNT(t.id), 0) as templates_count
		FROM kpi_categories c
		LEFT JOIN kpi_templates t ON t.category_id = c.id
		GROUP BY c.id
		ORDER BY c.sort_order ASC, c.name ASC
	`
	err := r.db.Select(&categories, query)
	return categories, err
}

func (r *KpiRepository) GetCategoryByID(id int) (*models.KpiCategory, error) {
	var category models.KpiCategory
	query := `
		SELECT 
			c.id, c.name, c.code, c.description, c.weight, c.sort_order, c.is_active, c.created_at, c.updated_at,
			COALESCE(COUNT(t.id), 0) as templates_count
		FROM kpi_categories c
		LEFT JOIN kpi_templates t ON t.category_id = c.id
		WHERE c.id = $1
		GROUP BY c.id
	`
	err := r.db.Get(&category, query, id)
	return &category, err
}

func (r *KpiRepository) CreateCategory(category *models.KpiCategory) error {
	query := `
		INSERT INTO kpi_categories (name, code, description, weight, sort_order, is_active, created_at, updated_at)
		VALUES (:name, :code, :description, :weight, :sort_order, :is_active, :created_at, :updated_at)
		RETURNING id
	`
	rows, err := r.db.NamedQuery(query, category)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&category.ID)
	}
	return nil
}

func (r *KpiRepository) UpdateCategory(category *models.KpiCategory) error {
	query := `
		UPDATE kpi_categories 
		SET name = :name, code = :code, description = :description, 
		    weight = :weight, sort_order = :sort_order, is_active = :is_active, updated_at = :updated_at
		WHERE id = :id
	`
	_, err := r.db.NamedExec(query, category)
	return err
}

func (r *KpiRepository) DeleteCategory(id int) error {
	var count int
	_ = r.db.Get(&count, "SELECT COUNT(*) FROM kpi_templates WHERE category_id = $1", id)
	if count > 0 {
		return fmt.Errorf("tidak dapat menghapus kategori yang masih memiliki template KPI")
	}

	_, err := r.db.Exec("DELETE FROM kpi_categories WHERE id = $1", id)
	return err
}

// --- Templates ---

func (r *KpiRepository) GetAllTemplates() ([]models.KpiTemplate, error) {
	templates := []models.KpiTemplate{}
	query := `
		SELECT 
			t.id, t.category_id, COALESCE(c.name, '-') as category_name,
			t.name, t.code, t.description, t.measurement_type, t.unit,
			t.target_min, t.target_max, t.weight, t.is_active,
			t.created_at, t.updated_at
		FROM kpi_templates t
		LEFT JOIN kpi_categories c ON c.id = t.category_id
		ORDER BY t.category_id ASC, t.name ASC
	`
	err := r.db.Select(&templates, query)
	if err == nil {
		for i := range templates {
			formatTemplateDisplay(&templates[i])
		}
	}
	return templates, err
}

func (r *KpiRepository) GetTemplateByID(id int) (*models.KpiTemplate, error) {
	var template models.KpiTemplate
	query := `
		SELECT 
			t.id, t.category_id, COALESCE(c.name, '-') as category_name,
			t.name, t.code, t.description, t.measurement_type, t.unit,
			t.target_min, t.target_max, t.weight, t.is_active,
			t.created_at, t.updated_at
		FROM kpi_templates t
		LEFT JOIN kpi_categories c ON c.id = t.category_id
		WHERE t.id = $1
	`
	err := r.db.Get(&template, query, id)
	if err == nil {
		formatTemplateDisplay(&template)
	}
	return &template, err
}

func (r *KpiRepository) CreateTemplate(template *models.KpiTemplate) error {
	query := `
		INSERT INTO kpi_templates (
			category_id, name, code, description, measurement_type, unit,
			target_min, target_max, weight, is_active, created_at, updated_at
		) VALUES (
			:category_id, :name, :code, :description, :measurement_type, :unit,
			:target_min, :target_max, :weight, :is_active, :created_at, :updated_at
		) RETURNING id
	`
	rows, err := r.db.NamedQuery(query, template)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&template.ID)
	}
	return nil
}

func (r *KpiRepository) UpdateTemplate(template *models.KpiTemplate) error {
	query := `
		UPDATE kpi_templates 
		SET category_id = :category_id, name = :name, code = :code, description = :description,
		    measurement_type = :measurement_type, unit = :unit, target_min = :target_min,
		    target_max = :target_max, weight = :weight, is_active = :is_active, updated_at = :updated_at
		WHERE id = :id
	`
	_, err := r.db.NamedExec(query, template)
	return err
}

func (r *KpiRepository) DeleteTemplate(id int) error {
	_, err := r.db.Exec("DELETE FROM kpi_templates WHERE id = $1", id)
	return err
}

func formatTemplateDisplay(tpl *models.KpiTemplate) {
	switch tpl.MeasurementType {
	case "numeric":
		tpl.MeasurementTypeLabel = "Angka"
	case "percentage":
		tpl.MeasurementTypeLabel = "Persentase"
	case "rating":
		tpl.MeasurementTypeLabel = "Rating (1-5)"
	case "yes_no":
		tpl.MeasurementTypeLabel = "Ya/Tidak"
	default:
		tpl.MeasurementTypeLabel = tpl.MeasurementType
	}

	if tpl.TargetMin != nil && tpl.TargetMax != nil {
		val := fmt.Sprintf("%.0f - %.0f", *tpl.TargetMin, *tpl.TargetMax)
		tpl.TargetRange = &val
	} else if tpl.TargetMin != nil {
		val := fmt.Sprintf("≥ %.0f", *tpl.TargetMin)
		tpl.TargetRange = &val
	} else if tpl.TargetMax != nil {
		val := fmt.Sprintf("≤ %.0f", *tpl.TargetMax)
		tpl.TargetRange = &val
	}
}

