package models

import (
	"time"
)

type OutgoingLetter struct {
	ID                    int        `db:"id" json:"id"`
	TemplateID            int        `db:"template_id" json:"template_id"`
	IncomingLetterID      *int       `db:"incoming_letter_id" json:"incoming_letter_id"`
	LetterNumber          *string    `db:"letter_number" json:"letter_number"`
	Subject               string     `db:"subject" json:"subject"`
	LetterDate            string     `db:"letter_date" json:"letter_date"`
	VariableValues        *string    `db:"variable_values" json:"variable_values"` // JSON
	RenderedHTML          *string    `db:"rendered_html" json:"rendered_html"`
	PdfPath               *string    `db:"pdf_path" json:"pdf_path"`
	Attachments           *string    `db:"attachments" json:"attachments"` // JSON
	Status                string     `db:"status" json:"status"`
	Notes                 *string    `db:"notes" json:"notes"`
	CurrentVersion        int        `db:"current_version" json:"current_version"`
	RevisionRequested     bool       `db:"revision_requested" json:"revision_requested"`
	RevisionRequestNotes  *string    `db:"revision_request_notes" json:"revision_request_notes"`
	RevisionRequestedByID *int       `db:"revision_requested_by" json:"revision_requested_by"`
	CreatedBy             int        `db:"created_by" json:"created_by"`
	UpdatedBy             *int       `db:"updated_by" json:"updated_by"`
	CreatedAt             time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt             time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt             *time.Time `db:"deleted_at" json:"deleted_at"`

	// Joins
	TemplateName        *string `db:"template_name" json:"template_name"`
	CreatorName         *string `db:"creator_name" json:"creator_name"`
	IncomingLetterSubject *string `db:"incoming_letter_subject" json:"incoming_letter_subject"`

	Signatories []LetterSignatory `db:"-" json:"signatories"`
}
