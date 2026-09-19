package models

import (
	"time"
)

type WorkSchedule struct {
	ID                  int        `db:"id" json:"id"`
	Code                string     `db:"code" json:"code"`
	Name                string     `db:"name" json:"name"`
	Description         *string    `db:"description" json:"description"`
	ClockInTime         string     `db:"clock_in_time" json:"clock_in_time"`
	ClockOutTime        string     `db:"clock_out_time" json:"clock_out_time"`
	BreakStart          *string    `db:"break_start" json:"break_start"`
	BreakEnd            *string    `db:"break_end" json:"break_end"`
	IsSpecial           bool       `db:"is_special" json:"is_special"`
	LateTolerance       int        `db:"late_tolerance" json:"late_tolerance"`
	EarlyLeaveTolerance int        `db:"early_leave_tolerance" json:"early_leave_tolerance"`
	IsFlexible          bool       `db:"is_flexible" json:"is_flexible"`
	FlexibleMinutes     *int       `db:"flexible_minutes" json:"flexible_minutes"`
	WorkHoursPerDay     int        `db:"work_hours_per_day" json:"work_hours_per_day"`
	IsActive            bool       `db:"is_active" json:"is_active"`
	CreatedAt           time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt           time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt           *time.Time `db:"deleted_at" json:"deleted_at"`
}
