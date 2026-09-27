package models

import "time"

type WorkLocation struct {
	ID        int        `db:"id" json:"id"`
	Name      string     `db:"name" json:"name"`
	Latitude  float64    `db:"latitude" json:"latitude"`
	Longitude float64    `db:"longitude" json:"longitude"`
	Radius    int        `db:"radius" json:"radius"`
	Address   *string    `db:"address" json:"address"`
	IsActive  bool       `db:"is_active" json:"is_active"`
	CreatedAt time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt *time.Time `db:"deleted_at" json:"deleted_at"`
}
