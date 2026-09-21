package models

type EmployeeWorkHistory struct {
	ID               int     `db:"id" json:"id"`
	EmployeeID       int     `db:"employee_id" json:"employee_id"`
	CompanyName      string  `db:"company_name" json:"company_name" binding:"required"`
	Position         string  `db:"position" json:"position" binding:"required"`
	StartDate        string  `db:"start_date" json:"start_date" binding:"required"`
	EndDate          *string `db:"end_date" json:"end_date"`
	JobDescription   *string `db:"job_description" json:"job_description"`
	LeavingReason    *string `db:"leaving_reason" json:"leaving_reason"`
	ReferenceContact *string `db:"reference_contact" json:"reference_contact"`
	ReferencePhone   *string `db:"reference_phone" json:"reference_phone"`
	CreatedAt        *string `db:"created_at" json:"created_at"`
	UpdatedAt        *string `db:"updated_at" json:"updated_at"`
}
