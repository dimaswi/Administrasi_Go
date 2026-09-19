package models

import (
	"time"
)

type Employee struct {
	ID                        int        `db:"id" json:"id"`
	EmployeeID                string     `db:"employee_id" json:"employee_id"`
	UserID                    *int       `db:"user_id" json:"user_id"`
	FirstName                 string     `db:"first_name" json:"first_name"`
	LastName                  *string    `db:"last_name" json:"last_name"`
	Nik                       *string    `db:"nik" json:"nik"`
	Gender                    string     `db:"gender" json:"gender"`
	PlaceOfBirth              *string    `db:"place_of_birth" json:"place_of_birth"`
	DateOfBirth               *string    `db:"date_of_birth" json:"date_of_birth"` // using string for simple date representation YYYY-MM-DD
	Religion                  *string    `db:"religion" json:"religion"`
	MaritalStatus             *string    `db:"marital_status" json:"marital_status"`
	BloodType                 *string    `db:"blood_type" json:"blood_type"`
	Address                   *string    `db:"address" json:"address"`
	City                      *string    `db:"city" json:"city"`
	Province                  *string    `db:"province" json:"province"`
	PostalCode                *string    `db:"postal_code" json:"postal_code"`
	Phone                     *string    `db:"phone" json:"phone"`
	PhoneSecondary            *string    `db:"phone_secondary" json:"phone_secondary"`
	Email                     *string    `db:"email" json:"email"`
	EmergencyContactName      *string    `db:"emergency_contact_name" json:"emergency_contact_name"`
	EmergencyContactPhone     *string    `db:"emergency_contact_phone" json:"emergency_contact_phone"`
	EmergencyContactRelation  *string    `db:"emergency_contact_relation" json:"emergency_contact_relation"`
	JobCategoryID             int        `db:"job_category_id" json:"job_category_id"`
	EmploymentStatusID        int        `db:"employment_status_id" json:"employment_status_id"`
	OrganizationUnitID        *int       `db:"organization_unit_id" json:"organization_unit_id"`
	Position                  *string    `db:"position" json:"position"`
	JoinDate                  string     `db:"join_date" json:"join_date"`
	ContractStartDate         *string    `db:"contract_start_date" json:"contract_start_date"`
	ContractEndDate           *string    `db:"contract_end_date" json:"contract_end_date"`
	PermanentDate             *string    `db:"permanent_date" json:"permanent_date"`
	ResignDate                *string    `db:"resign_date" json:"resign_date"`
	ResignReason              *string    `db:"resign_reason" json:"resign_reason"`
	EducationLevelID          *int       `db:"education_level_id" json:"education_level_id"`
	EducationInstitution      *string    `db:"education_institution" json:"education_institution"`
	EducationMajor            *string    `db:"education_major" json:"education_major"`
	EducationYear             *int       `db:"education_year" json:"education_year"`
	Photo                     *string    `db:"photo" json:"photo"`
	KtpFile                   *string    `db:"ktp_file" json:"ktp_file"`
	NpwpNumber                *string    `db:"npwp_number" json:"npwp_number"`
	NpwpFile                  *string    `db:"npwp_file" json:"npwp_file"`
	BpjsKesehatanNumber       *string    `db:"bpjs_kesehatan_number" json:"bpjs_kesehatan_number"`
	BpjsKetenagakerjaanNumber *string    `db:"bpjs_ketenagakerjaan_number" json:"bpjs_ketenagakerjaan_number"`
	BankName                  *string    `db:"bank_name" json:"bank_name"`
	BankAccountNumber         *string    `db:"bank_account_number" json:"bank_account_number"`
	BankAccountName           *string    `db:"bank_account_name" json:"bank_account_name"`
	Status                    string     `db:"status" json:"status"`
	Notes                     *string    `db:"notes" json:"notes"`
	CreatedAt                 time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt                 time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt                 *time.Time `db:"deleted_at" json:"deleted_at"`
}
