package models

import "time"

type MeetingActionItem struct {
	ID          int        `db:"id" json:"id"`
	MeetingID   int        `db:"meeting_id" json:"meeting_id"`
	Title       string     `db:"title" json:"title"`
	Description *string    `db:"description" json:"description"`
	AssignedTo  *int       `db:"assigned_to" json:"assigned_to"`
	Deadline    *string    `db:"deadline" json:"deadline"` // YYYY-MM-DD
	Priority    string     `db:"priority" json:"priority"` // high, medium, low
	Status      string     `db:"status" json:"status"`     // pending, in_progress, completed, cancelled
	Notes       *string    `db:"notes" json:"notes"`
	CompletedAt *time.Time `db:"completed_at" json:"completed_at"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updated_at"`

	// Relation
	AssignedUser *User `db:"-" json:"assigned_user,omitempty"`
}
