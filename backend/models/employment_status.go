package models

import (
	"time"
)

type EmploymentStatus struct {
	ID          int        `db:"id" json:"id"`
	Code        string     `db:"code" json:"code"`
	Name        string     `db:"name" json:"name"`
	Description *string    `db:"description" json:"description"`
	IsPermanent bool       `db:"is_permanent" json:"is_permanent"`
	IsActive    bool       `db:"is_active" json:"is_active"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updated_at"`
}
