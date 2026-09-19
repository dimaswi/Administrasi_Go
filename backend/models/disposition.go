package models

import (
	"time"
)

type Disposition struct {
	ID                  int64      `db:"id" json:"id"`
	IncomingLetterID    int64      `db:"incoming_letter_id" json:"incoming_letter_id"`
	ParentDispositionID *int64     `db:"parent_disposition_id" json:"parent_disposition_id"`
	FromUserID          int64      `db:"from_user_id" json:"from_user_id"`
	ToUserID            int64      `db:"to_user_id" json:"to_user_id"`
	Instruction         string     `db:"instruction" json:"instruction"`
	Notes               *string    `db:"notes" json:"notes"`
	Priority            string     `db:"priority" json:"priority"`
	Deadline            *time.Time `db:"deadline" json:"deadline"`
	Status              string     `db:"status" json:"status"`
	ReadAt              *time.Time `db:"read_at" json:"read_at"`
	CompletedAt         *time.Time `db:"completed_at" json:"completed_at"`
	CreatedAt           time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt           time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt           *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`
}
