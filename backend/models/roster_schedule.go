package models

import "time"

type RosterSchedule struct {
	ID             int        `db:"id" json:"id"`
	EmployeeID     *int       `db:"employee_id" json:"employee_id"`
	WorkScheduleID int        `db:"work_schedule_id" json:"work_schedule_id"`
	Date           string     `db:"date" json:"date"` // YYYY-MM-DD
	Notes          *string    `db:"notes" json:"notes"`
	CreatedAt      time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at" json:"updated_at"`

	// Relations
	Employee         *Employee     `db:"-" json:"employee,omitempty"`
	WorkSchedule     *WorkSchedule `db:"-" json:"work_schedule,omitempty"`
	
	// Joined fields
	EmployeeName     *string       `db:"employee_name" json:"employee_name,omitempty"`
	WorkScheduleName *string       `db:"work_schedule_name" json:"work_schedule_name,omitempty"`
}
