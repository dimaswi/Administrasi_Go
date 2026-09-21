package models

type EmployeeFamily struct {
	ID                 int     `db:"id" json:"id"`
	EmployeeID         int     `db:"employee_id" json:"employee_id"`
	Name               string  `db:"name" json:"name" binding:"required"`
	Relation           string  `db:"relation" json:"relation" binding:"required"`
	Nik                *string `db:"nik" json:"nik"`
	Gender             *string `db:"gender" json:"gender"`
	PlaceOfBirth       *string `db:"place_of_birth" json:"place_of_birth"`
	DateOfBirth        *string `db:"date_of_birth" json:"date_of_birth"`
	Occupation         *string `db:"occupation" json:"occupation"`
	Phone              *string `db:"phone" json:"phone"`
	IsEmergencyContact bool    `db:"is_emergency_contact" json:"is_emergency_contact"`
	IsDependent        bool    `db:"is_dependent" json:"is_dependent"`
	Notes              *string `db:"notes" json:"notes"`
	CreatedAt          *string `db:"created_at" json:"created_at"`
	UpdatedAt          *string `db:"updated_at" json:"updated_at"`
}
