package models

import "time"

type EmployeeSchedule struct {
	ID                 int        `db:"id" json:"id"`
	UserID             int        `db:"user_id" json:"user_id"`
	StartDate          string     `db:"start_date" json:"start_date"` // YYYY-MM-DD
	EndDate            *string    `db:"end_date" json:"end_date"`
	MondayShiftID      *int       `db:"monday_shift_id" json:"monday_shift_id"`
	TuesdayShiftID     *int       `db:"tuesday_shift_id" json:"tuesday_shift_id"`
	WednesdayShiftID   *int       `db:"wednesday_shift_id" json:"wednesday_shift_id"`
	ThursdayShiftID    *int       `db:"thursday_shift_id" json:"thursday_shift_id"`
	FridayShiftID      *int       `db:"friday_shift_id" json:"friday_shift_id"`
	SaturdayShiftID    *int       `db:"saturday_shift_id" json:"saturday_shift_id"`
	SundayShiftID      *int       `db:"sunday_shift_id" json:"sunday_shift_id"`
	CreatedAt          time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt          time.Time  `db:"updated_at" json:"updated_at"`
	
	// Relations
	User             *User         `db:"-" json:"user,omitempty"`
	MondayShift      *WorkSchedule `db:"-" json:"monday_shift,omitempty"`
	TuesdayShift     *WorkSchedule `db:"-" json:"tuesday_shift,omitempty"`
	WednesdayShift   *WorkSchedule `db:"-" json:"wednesday_shift,omitempty"`
	ThursdayShift    *WorkSchedule `db:"-" json:"thursday_shift,omitempty"`
	FridayShift      *WorkSchedule `db:"-" json:"friday_shift,omitempty"`
	SaturdayShift    *WorkSchedule `db:"-" json:"saturday_shift,omitempty"`
	SundayShift      *WorkSchedule `db:"-" json:"sunday_shift,omitempty"`
}
