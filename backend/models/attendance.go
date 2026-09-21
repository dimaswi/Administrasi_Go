package models

import (
	"time"
)

type Attendance struct {
	ID             int        `db:"id" json:"id"`
	EmployeeID     int        `db:"employee_id" json:"employee_id"`
	Date           string     `db:"date" json:"date"`
	ClockIn        *string    `db:"clock_in" json:"clock_in"`
	ClockOut       *string    `db:"clock_out" json:"clock_out"`
	WorkScheduleID *int       `db:"work_schedule_id" json:"work_schedule_id"`
	Status         string     `db:"status" json:"status"`
	Notes          *string    `db:"notes" json:"notes"`
	IsManualEntry  bool       `db:"is_manual_entry" json:"is_manual_entry"`
	LateMinutes    int        `db:"late_minutes" json:"late_minutes"`
	CreatedAt      time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at" json:"updated_at"`
	
	// Optional relationships for joining
	EmployeeName     *string `db:"employee_name" json:"employee_name,omitempty"`
	WorkScheduleName *string `db:"work_schedule_name" json:"work_schedule_name,omitempty"`
}
