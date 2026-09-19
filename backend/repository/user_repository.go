package repository

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetAll() ([]models.User, error) {
	users := []models.User{}
	err := r.db.Select(&users, "SELECT * FROM users ORDER BY name")
	return users, err
}

func (r *UserRepository) GetByID(id int) (*models.User, error) {
	var user models.User
	err := r.db.Get(&user, "SELECT * FROM users WHERE id = $1 LIMIT 1", id)
	return &user, err
}

func (r *UserRepository) GetByNip(nip string) (*models.User, error) {
	var user models.User
	err := r.db.Get(&user, "SELECT * FROM users WHERE nip = $1 LIMIT 1", nip)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Create(user *models.User) error {
	query := `
		INSERT INTO users (name, nip, password, role_id, organization_unit_id, position, phone, created_at, updated_at)
		VALUES (:name, :nip, :password, :role_id, :organization_unit_id, :position, :phone, :created_at, :updated_at)
		RETURNING id
	`
	rows, err := r.db.NamedQuery(query, user)
	if err != nil {
		return err
	}
	defer rows.Close()

	if rows.Next() {
		rows.Scan(&user.ID)
	}
	return nil
}

func (r *UserRepository) Update(user *models.User) error {
	query := `
		UPDATE users 
		SET name = :name, nip = :nip, role_id = :role_id, organization_unit_id = :organization_unit_id, position = :position, phone = :phone, updated_at = :updated_at
	`
	// only update password if not empty
	if user.Password != "" {
		query += `, password = :password`
	}
	query += ` WHERE id = :id`
	
	_, err := r.db.NamedExec(query, user)
	return err
}

func (r *UserRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM users WHERE id = $1", id)
	return err
}
