package models

import (
	"time"
)

type Attendance struct {
	ID             int        `db:"id" json:"id"`
	UserID         int        `db:"user_id" json:"user_id"`
	Date           string     `db:"date" json:"date"`
	ClockIn        *time.Time `db:"clock_in" json:"clock_in"`
	ClockOut       *time.Time `db:"clock_out" json:"clock_out"`
	WorkScheduleID *int       `db:"work_schedule_id" json:"work_schedule_id"`
	Status         string     `db:"status" json:"status"`
	Notes          *string    `db:"notes" json:"notes"`
	CreatedAt      time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at" json:"updated_at"`
	
	// Optional relationships for joining
	UserName         *string `db:"user_name" json:"user_name,omitempty"`
	WorkScheduleName *string `db:"work_schedule_name" json:"work_schedule_name,omitempty"`
}
