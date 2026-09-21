package models

import (
	"time"
)

type LetterSignatory struct {
	ID               int        `db:"id" json:"id"`
	LetterID         int        `db:"letter_id" json:"letter_id"`
	UserID           int        `db:"user_id" json:"user_id"`
	SlotID           string     `db:"slot_id" json:"slot_id"`
	SignOrder        int        `db:"sign_order" json:"sign_order"`
	Status           string     `db:"status" json:"status"`
	SignedAt         *time.Time `db:"signed_at" json:"signed_at"`
	SignatureImage   *string    `db:"signature_image" json:"signature_image"`
	RejectionReason  *string    `db:"rejection_reason" json:"rejection_reason"`
	CertificateID    *string    `db:"certificate_id" json:"certificate_id"`
	DocumentHash     *string    `db:"document_hash" json:"document_hash"`
	CreatedAt        time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time  `db:"updated_at" json:"updated_at"`

	// Joins
	UserName *string `db:"user_name" json:"user_name"`
}
