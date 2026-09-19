package models

import "time"

type RosterSchedule struct {
	ID             int        `db:"id" json:"id"`
	UserID         int        `db:"user_id" json:"user_id"`
	WorkScheduleID int        `db:"work_schedule_id" json:"work_schedule_id"`
	Date           string     `db:"date" json:"date"` // YYYY-MM-DD
	Notes          *string    `db:"notes" json:"notes"`
	CreatedAt      time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at" json:"updated_at"`

	// Relations
	User         *User         `db:"-" json:"user,omitempty"`
	WorkSchedule *WorkSchedule `db:"-" json:"work_schedule,omitempty"`
}
