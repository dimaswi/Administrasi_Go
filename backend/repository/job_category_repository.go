package repository

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type JobCategoryRepository struct {
	db *sqlx.DB
}

func NewJobCategoryRepository(db *sqlx.DB) *JobCategoryRepository {
	return &JobCategoryRepository{db: db}
}

func (r *JobCategoryRepository) GetAll() ([]models.JobCategory, error) {
	categories := []models.JobCategory{}
	err := r.db.Select(&categories, "SELECT * FROM job_categories ORDER BY name")
	return categories, err
}

func (r *JobCategoryRepository) GetByID(id int) (*models.JobCategory, error) {
	var category models.JobCategory
	err := r.db.Get(&category, "SELECT * FROM job_categories WHERE id = $1", id)
	return &category, err
}

func (r *JobCategoryRepository) Create(category *models.JobCategory) error {
	query := `
		INSERT INTO job_categories (code, name, description, is_medical, requires_str, requires_sip, is_active, created_at, updated_at)
		VALUES (:code, :name, :description, :is_medical, :requires_str, :requires_sip, :is_active, :created_at, :updated_at)
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

func (r *JobCategoryRepository) Update(category *models.JobCategory) error {
	query := `
		UPDATE job_categories 
		SET code = :code, name = :name, description = :description, 
		    is_medical = :is_medical, requires_str = :requires_str, requires_sip = :requires_sip, 
		    is_active = :is_active, updated_at = :updated_at
		WHERE id = :id
	`
	_, err := r.db.NamedExec(query, category)
	return err
}

func (r *JobCategoryRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM job_categories WHERE id = $1", id)
	return err
}
