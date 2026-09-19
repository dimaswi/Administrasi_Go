package models

import (
	"time"
)

type OrganizationUnit struct {
	ID          int       `db:"id" json:"id"`
	Code        string    `db:"code" json:"code"`
	Name        string    `db:"name" json:"name"`
	Description *string   `db:"description" json:"description"`
	ParentID        *int       `db:"parent_id" json:"parent_id"`
	Level           int        `db:"level" json:"level"`
	HeadID          *int       `db:"head_id" json:"head_id"`
	LetterheadImage *string    `db:"letterhead_image" json:"letterhead_image"`
	IsActive        bool       `db:"is_active" json:"is_active"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt   *time.Time `db:"deleted_at" json:"deleted_at"`
}
