package repository

import (
	"backend/models"
	"time"

	"github.com/jmoiron/sqlx"
)

type WorkLocationRepository struct {
	db *sqlx.DB
}

func NewWorkLocationRepository(db *sqlx.DB) *WorkLocationRepository {
	return &WorkLocationRepository{db: db}
}

func (r *WorkLocationRepository) GetAll() ([]models.WorkLocation, error) {
	var list []models.WorkLocation
	err := r.db.Select(&list, "SELECT * FROM work_locations WHERE deleted_at IS NULL ORDER BY id DESC")
	if err != nil {
		return nil, err
	}
	if list == nil {
		list = []models.WorkLocation{}
	}
	return list, nil
}

func (r *WorkLocationRepository) GetActiveLocations() ([]models.WorkLocation, error) {
	var list []models.WorkLocation
	err := r.db.Select(&list, "SELECT * FROM work_locations WHERE is_active = TRUE AND deleted_at IS NULL ORDER BY id ASC")
	if err != nil {
		return nil, err
	}
	if list == nil {
		list = []models.WorkLocation{}
	}
	return list, nil
}

func (r *WorkLocationRepository) GetByID(id int) (*models.WorkLocation, error) {
	var loc models.WorkLocation
	err := r.db.Get(&loc, "SELECT * FROM work_locations WHERE id = $1 AND deleted_at IS NULL", id)
	if err != nil {
		return nil, err
	}
	return &loc, nil
}

func (r *WorkLocationRepository) Create(loc *models.WorkLocation) error {
	loc.CreatedAt = time.Now()
	loc.UpdatedAt = time.Now()
	query := `
		INSERT INTO work_locations (name, latitude, longitude, radius, address, is_active, created_at, updated_at)
		VALUES (:name, :latitude, :longitude, :radius, :address, :is_active, :created_at, :updated_at)
		RETURNING id
	`
	rows, err := r.db.NamedQuery(query, loc)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&loc.ID)
	}
	return nil
}

func (r *WorkLocationRepository) Update(loc *models.WorkLocation) error {
	loc.UpdatedAt = time.Now()
	query := `
		UPDATE work_locations
		SET name = :name, latitude = :latitude, longitude = :longitude, radius = :radius,
		    address = :address, is_active = :is_active, updated_at = :updated_at
		WHERE id = :id AND deleted_at IS NULL
	`
	_, err := r.db.NamedExec(query, loc)
	return err
}

func (r *WorkLocationRepository) Delete(id int) error {
	_, err := r.db.Exec("UPDATE work_locations SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1", id)
	return err
}
