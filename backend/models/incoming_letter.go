package models

import (
	"time"
)

type IncomingLetter struct {
	ID                    int64      `db:"id" json:"id"`
	IncomingNumber        string     `db:"incoming_number" json:"incoming_number"`
	OriginalNumber        string     `db:"original_number" json:"original_number"`
	OriginalDate          time.Time  `db:"original_date" json:"original_date"`
	ReceivedDate          time.Time  `db:"received_date" json:"received_date"`
	Sender                string     `db:"sender" json:"sender"`
	Subject               string     `db:"subject" json:"subject"`
	Category              string     `db:"category" json:"category"`
	Classification        string     `db:"classification" json:"classification"`
	AttachmentCount       int        `db:"attachment_count" json:"attachment_count"`
	AttachmentDescription *string    `db:"attachment_description" json:"attachment_description"`
	FilePath              *string    `db:"file_path" json:"file_path"`
	OrganizationUnitID    int64      `db:"organization_unit_id" json:"organization_unit_id"`
	RegisteredBy          int64      `db:"registered_by" json:"registered_by"`
	Status                string     `db:"status" json:"status"`
	Notes                 *string    `db:"notes" json:"notes"`
	CreatedAt             time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt             time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt             *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`
}
