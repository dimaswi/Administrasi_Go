package models

type EmployeeEducation struct {
	ID                 int     `db:"id" json:"id"`
	EmployeeID         int     `db:"employee_id" json:"employee_id"`
	EducationLevelID   int     `db:"education_level_id" json:"education_level_id" binding:"required"`
	Institution        string  `db:"institution" json:"institution" binding:"required"`
	Major              *string `db:"major" json:"major"`
	StartYear          *int    `db:"start_year" json:"start_year"`
	EndYear            *int    `db:"end_year" json:"end_year"`
	Gpa                *string `db:"gpa" json:"gpa"`
	CertificateNumber  *string `db:"certificate_number" json:"certificate_number"`
	CertificateFile    *string `db:"certificate_file" json:"certificate_file"`
	IsHighest          bool    `db:"is_highest" json:"is_highest"`
	Notes              *string `db:"notes" json:"notes"`
	CreatedAt          *string `db:"created_at" json:"created_at"`
	UpdatedAt          *string `db:"updated_at" json:"updated_at"`

	// Joins
	EducationLevelName *string `db:"education_level_name" json:"education_level_name,omitempty"`
}
