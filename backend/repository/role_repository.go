package repository

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type RoleRepository struct {
	db *sqlx.DB
}

func NewRoleRepository(db *sqlx.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

func (r *RoleRepository) GetAll() ([]models.Role, error) {
	roles := []models.Role{}
	err := r.db.Select(&roles, "SELECT * FROM roles ORDER BY name")
	return roles, err
}

func (r *RoleRepository) GetByID(id int) (*models.Role, error) {
	var role models.Role
	err := r.db.Get(&role, "SELECT * FROM roles WHERE id = $1", id)
	return &role, err
}

func (r *RoleRepository) GetPermissionsByRoleID(roleID int) ([]string, error) {
	permissions := []string{}
	query := `
		SELECT p.name 
		FROM permissions p
		JOIN role_permission rp ON p.id = rp.permission_id
		WHERE rp.role_id = $1
	`
	err := r.db.Select(&permissions, query, roleID)
	return permissions, err
}

func (r *RoleRepository) GetPermissionIDsByRoleID(roleID int) ([]int, error) {
	permissionIDs := []int{}
	query := `SELECT permission_id FROM role_permission WHERE role_id = $1`
	err := r.db.Select(&permissionIDs, query, roleID)
	return permissionIDs, err
}

func (r *RoleRepository) AssignPermissions(roleID int, permissionIDs []int) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}

	// Delete old permissions
	if _, err := tx.Exec("DELETE FROM role_permission WHERE role_id = $1", roleID); err != nil {
		tx.Rollback()
		return err
	}

	// Insert new permissions
	if len(permissionIDs) > 0 {
		query := "INSERT INTO role_permission (role_id, permission_id) VALUES ($1, $2)"
		for _, pid := range permissionIDs {
			if _, err := tx.Exec(query, roleID, pid); err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	return tx.Commit()
}

func (r *RoleRepository) Create(role *models.Role) error {
	query := `
		INSERT INTO roles (name, description, created_at, updated_at)
		VALUES (:name, :description, :created_at, :updated_at)
		RETURNING id
	`
	rows, err := r.db.NamedQuery(query, role)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&role.ID)
	}
	return nil
}

func (r *RoleRepository) Update(role *models.Role) error {
	query := `
		UPDATE roles 
		SET name = :name, description = :description, updated_at = :updated_at
		WHERE id = :id
	`
	_, err := r.db.NamedExec(query, role)
	return err
}

func (r *RoleRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM roles WHERE id = $1", id)
	return err
}
