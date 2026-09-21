package models

import (
	"time"
)

type User struct {
	ID            int       `db:"id" json:"id"`
	Name          string    `db:"name" json:"name"`
	Nip           string    `db:"nip" json:"nip"`
	Password      string    `db:"password" json:"-"`
	RoleID        *int      `db:"role_id" json:"role_id"`
	RememberToken *string   `db:"remember_token" json:"-"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time `db:"updated_at" json:"updated_at"`

	OrganizationUnit *OrganizationUnit `db:"-" json:"organization_unit,omitempty"`
}
