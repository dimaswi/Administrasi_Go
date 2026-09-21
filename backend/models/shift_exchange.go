package models

import "time"

type ShiftExchange struct {
	ID                     int        `db:"id" json:"id"`
	RequestingEmployeeID   *int       `db:"requesting_employee_id" json:"requesting_employee_id"`
	TargetEmployeeID       *int       `db:"target_employee_id" json:"target_employee_id"`
	OriginalRosterID       int        `db:"original_roster_id" json:"original_roster_id"`
	TargetRosterID         *int       `db:"target_roster_id" json:"target_roster_id"`
	Status                 string     `db:"status" json:"status"` // pending, approved, rejected
	Reason                 string     `db:"reason" json:"reason"`
	ApprovedBy             *int       `db:"approved_by" json:"approved_by"`
	ApprovedAt             *time.Time `db:"approved_at" json:"approved_at"`
	CreatedAt              time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt              time.Time  `db:"updated_at" json:"updated_at"`

	// Relations
	RequestingEmployee *Employee       `db:"-" json:"requesting_employee,omitempty"`
	TargetEmployee     *Employee       `db:"-" json:"target_employee,omitempty"`
	OriginalRoster     *RosterSchedule `db:"-" json:"original_roster,omitempty"`
	TargetRoster       *RosterSchedule `db:"-" json:"target_roster,omitempty"`
	Approver           *User           `db:"-" json:"approver,omitempty"`
}
