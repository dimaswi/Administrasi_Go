package models

import (
	"time"
)

type Training struct {
	ID            int       `db:"id" json:"id"`
	Code          string    `db:"code" json:"code"`
	Name          string    `db:"name" json:"name"`
	Description   *string   `db:"description" json:"description"`
	Type          string    `db:"type" json:"type"`
	TypeLabel     string    `db:"-" json:"type_label"`
	Category      *string   `db:"category" json:"category"`
	CategoryLabel string    `db:"-" json:"category_label"`
	Provider      *string   `db:"provider" json:"provider"`
	DurationHours *int      `db:"duration_hours" json:"duration_hours"`
	Cost          *float64  `db:"cost" json:"cost"`
	Location      *string   `db:"location" json:"location"`
	IsMandatory   bool      `db:"is_mandatory" json:"is_mandatory"`
	IsActive      bool      `db:"is_active" json:"is_active"`
	Objectives    *string   `db:"objectives" json:"objectives"`
	Prerequisites *string   `db:"prerequisites" json:"prerequisites"`
	ParticipantsCount int   `db:"participants_count" json:"participants_count"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time `db:"updated_at" json:"updated_at"`
}

type EmployeeTraining struct {
	ID                int        `db:"id" json:"id"`
	EmployeeID        int        `db:"employee_id" json:"employee_id"`
	EmployeeName      string     `db:"employee_name" json:"employee_name"`
	EmployeeNik       string     `db:"employee_nik" json:"employee_nik"`
	OrganizationUnit  *string    `db:"organization_unit" json:"organization_unit"`
	TrainingID        int        `db:"training_id" json:"training_id"`
	TrainingCode      string     `db:"training_code" json:"training_code"`
	TrainingName      string     `db:"training_name" json:"training_name"`
	Status            string     `db:"status" json:"status"`
	StatusLabel       string     `db:"-" json:"status_label"`
	StartDate         *time.Time `db:"start_date" json:"start_date"`
	EndDate           *time.Time `db:"end_date" json:"end_date"`
	CompletionDate    *time.Time `db:"completion_date" json:"completion_date"`
	Score             *float64   `db:"score" json:"score"`
	Grade             *string    `db:"grade" json:"grade"`
	CertificateNumber *string    `db:"certificate_number" json:"certificate_number"`
	CertificatePath   *string    `db:"certificate_path" json:"certificate_path"`
	CertificateExpiry *time.Time `db:"certificate_expiry" json:"certificate_expiry"`
	Feedback          *string    `db:"feedback" json:"feedback"`
	Rating            *int       `db:"rating" json:"rating"`
	Notes             *string    `db:"notes" json:"notes"`
	ApprovedBy        *int       `db:"approved_by" json:"approved_by"`
	ApprovedAt        *time.Time `db:"approved_at" json:"approved_at"`
	CreatedAt         time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt         time.Time  `db:"updated_at" json:"updated_at"`
}

