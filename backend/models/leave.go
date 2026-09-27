package models

import "time"

type Leave struct {
	ID                   int        `db:"id" json:"id"`
	EmployeeID           int        `db:"employee_id" json:"employee_id"`
	LeaveTypeID          int        `db:"leave_type_id" json:"leave_type_id"`
	StartDate            string     `db:"start_date" json:"start_date"` // YYYY-MM-DD
	EndDate              string     `db:"end_date" json:"end_date"`     // YYYY-MM-DD
	TotalDays            int        `db:"total_days" json:"total_days"`
	IsHalfDay            bool       `db:"is_half_day" json:"is_half_day"`
	HalfDayType          *string    `db:"half_day_type" json:"half_day_type"` // am/pm
	Reason               string     `db:"reason" json:"reason"`
	Attachment           *string    `db:"attachment" json:"attachment"`
	EmergencyContact     *string    `db:"emergency_contact" json:"emergency_contact"`
	EmergencyPhone       *string    `db:"emergency_phone" json:"emergency_phone"`
	DelegationTo         *int       `db:"delegation_to" json:"delegation_to"`
	Status               string     `db:"status" json:"status"` // draft, pending, approved, rejected, cancelled
	ApprovedBy           *int       `db:"approved_by" json:"approved_by"`
	ApprovedAt           *time.Time `db:"approved_at" json:"approved_at"`
	ApprovalNotes        *string    `db:"approval_notes" json:"approval_notes"`
	ApprovedByLevel2     *int       `db:"approved_by_level_2" json:"approved_by_level_2"`
	ApprovedAtLevel2     *time.Time `db:"approved_at_level_2" json:"approved_at_level_2"`
	ApprovalNotesLevel2  *string    `db:"approval_notes_level_2" json:"approval_notes_level_2"`
	CreatedBy            *int       `db:"created_by" json:"created_by"`
	UpdatedBy            *int       `db:"updated_by" json:"updated_by"`
	SubmittedAt          *time.Time `db:"submitted_at" json:"submitted_at"`
	CancelledAt          *time.Time `db:"cancelled_at" json:"cancelled_at"`
	CancellationReason   *string    `db:"cancellation_reason" json:"cancellation_reason"`
	CreatedAt            *time.Time `db:"created_at" json:"created_at"`
	UpdatedAt            *time.Time `db:"updated_at" json:"updated_at"`
	DeletedAt            *time.Time `db:"deleted_at" json:"deleted_at"`
	
	// Joins for frontend viewing convenience
	EmployeeName         *string    `db:"employee_name" json:"employee_name,omitempty"`
	LeaveTypeName        *string    `db:"leave_type_name" json:"leave_type_name,omitempty"`
	ApprovedByName       *string    `db:"approved_by_name" json:"approved_by_name,omitempty"`
	DelegationToName     *string    `db:"delegation_to_name" json:"delegation_to_name,omitempty"`
}
