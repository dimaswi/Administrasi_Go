package repository

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type PermissionRepository struct {
	db *sqlx.DB
}

func NewPermissionRepository(db *sqlx.DB) *PermissionRepository {
	return &PermissionRepository{db: db}
}

func (r *PermissionRepository) GetAll() ([]models.Permission, error) {
	permissions := []models.Permission{}
	err := r.db.Select(&permissions, "SELECT * FROM permissions ORDER BY module, name")
	return permissions, err
}

func (r *PermissionRepository) GetByID(id int) (*models.Permission, error) {
	var permission models.Permission
	err := r.db.Get(&permission, "SELECT * FROM permissions WHERE id = $1", id)
	return &permission, err
}

func (r *PermissionRepository) Create(permission *models.Permission) error {
	query := `
		INSERT INTO permissions (name, display_name, description, module, created_at, updated_at)
		VALUES (:name, :display_name, :description, :module, :created_at, :updated_at)
		RETURNING id
	`
	rows, err := r.db.NamedQuery(query, permission)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&permission.ID)
	}
	return nil
}

func (r *PermissionRepository) Update(permission *models.Permission) error {
	query := `
		UPDATE permissions 
		SET name = :name, display_name = :display_name, description = :description, module = :module, updated_at = :updated_at
		WHERE id = :id
	`
	_, err := r.db.NamedExec(query, permission)
	return err
}

func (r *PermissionRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM permissions WHERE id = $1", id)
	return err
}
