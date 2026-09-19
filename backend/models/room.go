package models

import "time"

type Room struct {
	ID          int       `db:"id" json:"id"`
	Code        string    `db:"code" json:"code"`
	Name        string    `db:"name" json:"name"`
	Building    *string    `db:"building" json:"building"`
	Floor       *string    `db:"floor" json:"floor"`
	Capacity    *int       `db:"capacity" json:"capacity"`
	Facilities  *string    `db:"facilities" json:"facilities"`
	Description *string    `db:"description" json:"description"`
	IsActive    bool       `db:"is_active" json:"is_active"`
	CreatedAt   *time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   *time.Time `db:"updated_at" json:"updated_at"`
}
