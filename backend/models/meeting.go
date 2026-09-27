package models

import "time"

type Meeting struct {
	ID                    int        `db:"id" json:"id"`
	MeetingNumber         *string    `db:"meeting_number" json:"meeting_number"`
	Title                 string     `db:"title" json:"title"`
	Agenda                *string    `db:"agenda" json:"agenda"`
	MeetingDate           string     `db:"meeting_date" json:"meeting_date"`
	StartTime             string     `db:"start_time" json:"start_time"`
	EndTime               string     `db:"end_time" json:"end_time"`
	RoomID                *int       `db:"room_id" json:"room_id"`
	OrganizerID           *int       `db:"organizer_id" json:"organizer_id"`
	OrganizationUnitID    *int       `db:"organization_unit_id" json:"organization_unit_id"`
	IncomingLetterID      *int       `db:"incoming_letter_id" json:"incoming_letter_id"`
	Status                string     `db:"status" json:"status"`
	Notes                 *string    `db:"notes" json:"notes"`
	MinutesOfMeeting      *string    `db:"minutes_of_meeting" json:"minutes_of_meeting"`
	InvitationFile        *string    `db:"invitation_file" json:"invitation_file"`
	MemoFile              *string    `db:"memo_file" json:"memo_file"`
	AttendanceFile        *string    `db:"attendance_file" json:"attendance_file"`
	MemoContent           *string    `db:"memo_content" json:"memo_content"`
	CheckinToken          *string    `db:"checkin_token" json:"checkin_token"`
	CheckinTokenExpiresAt *time.Time `db:"checkin_token_expires_at" json:"checkin_token_expires_at"`
	CheckinTokenDuration  *int       `db:"checkin_token_duration" json:"checkin_token_duration"`
	CreatedAt             *time.Time `db:"created_at" json:"created_at"`
	UpdatedAt             *time.Time `db:"updated_at" json:"updated_at"`

	// Relations
	Room             *Room               `db:"-" json:"room,omitempty"`
	Organizer        *User               `db:"-" json:"organizer,omitempty"`
	OrganizationUnit *OrganizationUnit   `db:"-" json:"organization_unit,omitempty"`
	Participants     []MeetingParticipant `db:"-" json:"participants,omitempty"`
	ActionItems      []MeetingActionItem  `db:"-" json:"action_items,omitempty"`

	// Attendance Status for Current User
	IsCheckedIn          bool    `db:"-" json:"is_checked_in"`
	UserAttendanceStatus *string `db:"-" json:"user_attendance_status,omitempty"`
}

