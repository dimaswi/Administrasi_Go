package models

import (
	"time"
)

type PerformancePeriod struct {
	ID           int       `db:"id" json:"id"`
	Name         string    `db:"name" json:"name"`
	Type         string    `db:"type" json:"type"`
	TypeLabel    string    `db:"-" json:"type_label"`
	StartDate    time.Time `db:"start_date" json:"start_date"`
	EndDate      time.Time `db:"end_date" json:"end_date"`
	Status       string    `db:"status" json:"status"`
	StatusLabel  string    `db:"-" json:"status_label"`
	Description  *string   `db:"description" json:"description"`
	IsCurrent    bool      `db:"is_current" json:"is_current"`
	ReviewsCount int       `db:"reviews_count" json:"reviews_count"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type PerformanceReview struct {
	ID                int        `db:"id" json:"id"`
	EmployeeID        int        `db:"employee_id" json:"employee_id"`
	EmployeeName      string     `db:"employee_name" json:"employee_name"`
	EmployeeNik       string     `db:"employee_nik" json:"employee_nik"`
	OrganizationUnit  *string    `db:"organization_unit" json:"organization_unit"`
	PeriodID          int        `db:"period_id" json:"period_id"`
	PeriodName        string     `db:"period_name" json:"period_name"`
	ReviewerID        *int       `db:"reviewer_id" json:"reviewer_id"`
	ReviewerName      *string    `db:"reviewer_name" json:"reviewer_name"`
	Status            string     `db:"status" json:"status"`
	StatusLabel       string     `db:"-" json:"status_label"`
	SelfScore         *float64   `db:"self_score" json:"self_score"`
	ManagerScore      *float64   `db:"manager_score" json:"manager_score"`
	FinalScore        *float64   `db:"final_score" json:"final_score"`
	FinalGrade        *string    `db:"final_grade" json:"final_grade"`
	EmployeeNotes     *string    `db:"employee_notes" json:"employee_notes"`
	ManagerNotes      *string    `db:"manager_notes" json:"manager_notes"`
	Strengths         *string    `db:"strengths" json:"strengths"`
	Improvements      *string    `db:"improvements" json:"improvements"`
	DevelopmentPlan   *string    `db:"development_plan" json:"development_plan"`
	SelfReviewedAt    *time.Time `db:"self_reviewed_at" json:"self_reviewed_at"`
	ManagerReviewedAt *time.Time `db:"manager_reviewed_at" json:"manager_reviewed_at"`
	CompletedAt       *time.Time `db:"completed_at" json:"completed_at"`
	CreatedAt         time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt         time.Time  `db:"updated_at" json:"updated_at"`
}

type PerformanceReviewItem struct {
	ID                 int      `db:"id" json:"id"`
	ReviewID           int      `db:"review_id" json:"review_id"`
	KpiTemplateID      int      `db:"kpi_template_id" json:"kpi_template_id"`
	KpiTemplateName    string   `db:"kpi_template_name" json:"kpi_template_name"`
	KpiCategoryName    string   `db:"kpi_category_name" json:"kpi_category_name"`
	TargetMin          *float64 `db:"target_min" json:"target_min"`
	TargetMax          *float64 `db:"target_max" json:"target_max"`
	Unit               *string  `db:"unit" json:"unit"`
	Weight             int      `db:"weight" json:"weight"`
	ActualValue        *float64 `db:"actual_value" json:"actual_value"`
	SelfScore          *float64 `db:"self_score" json:"self_score"`
	ManagerScore       *float64 `db:"manager_score" json:"manager_score"`
	FinalScore         *float64 `db:"final_score" json:"final_score"`
	SelfNotes          *string  `db:"self_notes" json:"self_notes"`
	ManagerNotes       *string  `db:"manager_notes" json:"manager_notes"`
}

type Feedback360Session struct {
	ID                int        `db:"id" json:"id"`
	PeriodID          int        `db:"period_id" json:"period_id"`
	PeriodName        string     `db:"period_name" json:"period_name"`
	Name              string     `db:"name" json:"name"`
	Description       *string    `db:"description" json:"description"`
	StartDate         time.Time  `db:"start_date" json:"start_date"`
	EndDate           time.Time  `db:"end_date" json:"end_date"`
	Status            string     `db:"status" json:"status"`
	StatusLabel       string     `db:"-" json:"status_label"`
	ParticipantsCount int        `db:"participants_count" json:"participants_count"`
	CreatedAt         time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt         time.Time  `db:"updated_at" json:"updated_at"`
}

type CalibrationSession struct {
	ID           int       `db:"id" json:"id"`
	PeriodID     int       `db:"period_id" json:"period_id"`
	PeriodName   string    `db:"period_name" json:"period_name"`
	Name         string    `db:"name" json:"name"`
	Description  *string   `db:"description" json:"description"`
	Date         time.Time `db:"date" json:"date"`
	Status       string    `db:"status" json:"status"`
	StatusLabel  string    `db:"-" json:"status_label"`
	ReviewsCount int       `db:"reviews_count" json:"reviews_count"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

