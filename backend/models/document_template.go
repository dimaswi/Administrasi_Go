package models

import (
	"time"
)

type DocumentTemplate struct {
	ID                 int        `db:"id" json:"id"`
	Name               string     `db:"name" json:"name"`
	Code               string     `db:"code" json:"code"`
	Category           *string    `db:"category" json:"category"`
	OrganizationUnitID int        `db:"organization_unit_id" json:"organization_unit_id"`
	NumberingGroupID   *int       `db:"numbering_group_id" json:"numbering_group_id"`
	Description        *string    `db:"description" json:"description"`
	PageSettings       string     `db:"page_settings" json:"page_settings"` // JSON
	HeaderSettings     *string    `db:"header_settings" json:"header_settings"` // JSON
	ContentBlocks      string     `db:"content_blocks" json:"content_blocks"` // JSON
	FooterSettings     *string    `db:"footer_settings" json:"footer_settings"` // JSON
	SignatureSettings  string     `db:"signature_settings" json:"signature_settings"` // JSON
	Variables          string     `db:"variables" json:"variables"` // JSON
	NumberingFormat    *string    `db:"numbering_format" json:"numbering_format"`
	IsActive           bool       `db:"is_active" json:"is_active"`
	CreatedBy          int        `db:"created_by" json:"created_by"`
	UpdatedBy          *int       `db:"updated_by" json:"updated_by"`
	CreatedAt          time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt          time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt          *time.Time `db:"deleted_at" json:"deleted_at"`
	TemplateType       string     `db:"template_type" json:"template_type"`

	// Not in DB, but used in joins/responses
	OrganizationUnitName *string `db:"organization_unit_name" json:"organization_unit_name"`
}
