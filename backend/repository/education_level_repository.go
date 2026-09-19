package repository

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type EducationLevelRepository struct {
	db *sqlx.DB
}

func NewEducationLevelRepository(db *sqlx.DB) *EducationLevelRepository {
	return &EducationLevelRepository{db: db}
}

func (r *EducationLevelRepository) GetAll() ([]models.EducationLevel, error) {
	levels := []models.EducationLevel{}
	err := r.db.Select(&levels, "SELECT * FROM education_levels ORDER BY level")
	return levels, err
}

func (r *EducationLevelRepository) GetByID(id int) (*models.EducationLevel, error) {
	var level models.EducationLevel
	err := r.db.Get(&level, "SELECT * FROM education_levels WHERE id = $1", id)
	return &level, err
}

func (r *EducationLevelRepository) Create(level *models.EducationLevel) error {
	query := `
		INSERT INTO education_levels (level, name, is_active, created_at, updated_at)
		VALUES (:level, :name, :is_active, :created_at, :updated_at)
		RETURNING id
	`
	rows, err := r.db.NamedQuery(query, level)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&level.ID)
	}
	return nil
}

func (r *EducationLevelRepository) Update(level *models.EducationLevel) error {
	query := `
		UPDATE education_levels 
		SET level = :level, name = :name, is_active = :is_active, updated_at = :updated_at
		WHERE id = :id
	`
	_, err := r.db.NamedExec(query, level)
	return err
}

func (r *EducationLevelRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM education_levels WHERE id = $1", id)
	return err
}
