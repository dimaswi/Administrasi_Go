package models

import (
	"time"
)

type EducationLevel struct {
	ID        int        `db:"id" json:"id"`
	Code      string     `db:"code" json:"code"`
	Name      string     `db:"name" json:"name"`
	Level     int        `db:"level" json:"level"`
	IsActive  bool       `db:"is_active" json:"is_active"`
	CreatedAt time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt time.Time  `db:"updated_at" json:"updated_at"`
}
