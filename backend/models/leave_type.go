package models

import (
	"time"
)

type LeaveType struct {
	ID                 int        `db:"id" json:"id"`
	Code               string     `db:"code" json:"code"`
	Name               string     `db:"name" json:"name"`
	Description        *string    `db:"description" json:"description"`
	DefaultQuota       int        `db:"default_quota" json:"default_quota"`
	IsPaid             bool       `db:"is_paid" json:"is_paid"`
	RequiresApproval   bool       `db:"requires_approval" json:"requires_approval"`
	AllowCarryOver     bool       `db:"allow_carry_over" json:"allow_carry_over"`
	MaxCarryOverDays   int        `db:"max_carry_over_days" json:"max_carry_over_days"`
	MinAdvanceDays     int        `db:"min_advance_days" json:"min_advance_days"`
	MaxConsecutiveDays *int       `db:"max_consecutive_days" json:"max_consecutive_days"`
	IsActive           bool       `db:"is_active" json:"is_active"`
	SortOrder          int        `db:"sort_order" json:"sort_order"`
	Color              string     `db:"color" json:"color"`
	CreatedAt          time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt          time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt          *time.Time `db:"deleted_at" json:"deleted_at"`
}
