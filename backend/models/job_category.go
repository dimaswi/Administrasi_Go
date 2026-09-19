package models

import (
	"time"
)

type JobCategory struct {
	ID          int        `db:"id" json:"id"`
	Code        string     `db:"code" json:"code"`
	Name        string     `db:"name" json:"name"`
	Description *string    `db:"description" json:"description"`
	IsMedical   bool       `db:"is_medical" json:"is_medical"`
	RequiresSTR bool       `db:"requires_str" json:"requires_str"`
	RequiresSIP bool       `db:"requires_sip" json:"requires_sip"`
	IsActive    bool       `db:"is_active" json:"is_active"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updated_at"`
}
