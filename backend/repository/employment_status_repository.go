package repository

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type EmploymentStatusRepository struct {
	db *sqlx.DB
}

func NewEmploymentStatusRepository(db *sqlx.DB) *EmploymentStatusRepository {
	return &EmploymentStatusRepository{db: db}
}

func (r *EmploymentStatusRepository) GetAll() ([]models.EmploymentStatus, error) {
	statuses := []models.EmploymentStatus{}
	err := r.db.Select(&statuses, "SELECT * FROM employment_statuses ORDER BY id")
	return statuses, err
}

func (r *EmploymentStatusRepository) GetByID(id int) (*models.EmploymentStatus, error) {
	var status models.EmploymentStatus
	err := r.db.Get(&status, "SELECT * FROM employment_statuses WHERE id = $1", id)
	return &status, err
}

func (r *EmploymentStatusRepository) Create(status *models.EmploymentStatus) error {
	query := `
		INSERT INTO employment_statuses (name, is_active, created_at, updated_at)
		VALUES (:name, :is_active, :created_at, :updated_at)
		RETURNING id
	`
	rows, err := r.db.NamedQuery(query, status)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&status.ID)
	}
	return nil
}

func (r *EmploymentStatusRepository) Update(status *models.EmploymentStatus) error {
	query := `
		UPDATE employment_statuses 
		SET name = :name, is_active = :is_active, updated_at = :updated_at
		WHERE id = :id
	`
	_, err := r.db.NamedExec(query, status)
	return err
}

func (r *EmploymentStatusRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM employment_statuses WHERE id = $1", id)
	return err
}
