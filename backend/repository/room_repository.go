package repository

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type RoomRepository struct {
	db *sqlx.DB
}

func NewRoomRepository(db *sqlx.DB) *RoomRepository {
	return &RoomRepository{db: db}
}

func (r *RoomRepository) GetAll() ([]models.Room, error) {
	rooms := []models.Room{}
	err := r.db.Select(&rooms, "SELECT * FROM rooms ORDER BY name")
	return rooms, err
}

func (r *RoomRepository) GetByID(id int) (*models.Room, error) {
	var room models.Room
	err := r.db.Get(&room, "SELECT * FROM rooms WHERE id = $1 LIMIT 1", id)
	return &room, err
}

func (r *RoomRepository) Create(room *models.Room) error {
	query := `
		INSERT INTO rooms (code, name, building, floor, capacity, facilities, description, is_active, created_at, updated_at)
		VALUES (:code, :name, :building, :floor, :capacity, :facilities, :description, :is_active, :created_at, :updated_at)
		RETURNING id
	`
	rows, err := r.db.NamedQuery(query, room)
	if err != nil {
		return err
	}
	defer rows.Close()

	if rows.Next() {
		rows.Scan(&room.ID)
	}
	return nil
}

func (r *RoomRepository) Update(room *models.Room) error {
	query := `
		UPDATE rooms 
		SET code = :code, name = :name, building = :building, floor = :floor, capacity = :capacity, facilities = :facilities, description = :description, is_active = :is_active, updated_at = :updated_at
		WHERE id = :id
	`
	_, err := r.db.NamedExec(query, room)
	return err
}

func (r *RoomRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM rooms WHERE id = $1", id)
	return err
}
