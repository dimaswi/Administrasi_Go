package models

import (
	"time"
)

type LetterRevision struct {
	ID               int       `db:"id" json:"id"`
	LetterID         int       `db:"letter_id" json:"letter_id"`
	Version          int       `db:"version" json:"version"`
	Type             string    `db:"type" json:"type"`
	VariableValues   *string   `db:"variable_values" json:"variable_values"` // JSON
	RenderedHTML     *string   `db:"rendered_html" json:"rendered_html"`
	PdfPath          *string   `db:"pdf_path" json:"pdf_path"`
	RevisionNotes    *string   `db:"revision_notes" json:"revision_notes"`
	RequestedChanges *string   `db:"requested_changes" json:"requested_changes"`
	CreatedBy        *int      `db:"created_by" json:"created_by"`
	CreatedAt        time.Time `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time `db:"updated_at" json:"updated_at"`

	// Joins
	CreatorName *string `db:"creator_name" json:"creator_name"`
}
