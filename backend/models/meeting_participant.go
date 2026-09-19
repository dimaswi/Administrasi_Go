package models

import "time"

type MeetingParticipant struct {
	ID               int       `db:"id" json:"id"`
	MeetingID        int       `db:"meeting_id" json:"meeting_id"`
	UserID           int       `db:"user_id" json:"user_id"`
	Role             string    `db:"role" json:"role"` // participant, moderator, secretary, observer
	AttendanceStatus string    `db:"attendance_status" json:"attendance_status"` // invited, confirmed, attended, absent, excused
	CheckInTime      *string   `db:"check_in_time" json:"check_in_time"`
	Notes            *string   `db:"notes" json:"notes"`
	CreatedAt        time.Time `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time `db:"updated_at" json:"updated_at"`

	// Relation
	User *User `db:"-" json:"user,omitempty"`
}
