package models

import (
	"time"
)

type KpiCategory struct {
	ID             int       `db:"id" json:"id"`
	Name           string    `db:"name" json:"name"`
	Code           string    `db:"code" json:"code"`
	Description    *string   `db:"description" json:"description"`
	Weight         int       `db:"weight" json:"weight"`
	SortOrder      int       `db:"sort_order" json:"sort_order"`
	IsActive       bool      `db:"is_active" json:"is_active"`
	TemplatesCount int       `db:"templates_count" json:"templates_count"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time `db:"updated_at" json:"updated_at"`
}

type KpiTemplate struct {
	ID                   int       `db:"id" json:"id"`
	CategoryID           int       `db:"category_id" json:"category_id"`
	CategoryName         string    `db:"category_name" json:"category_name"`
	Name                 string    `db:"name" json:"name"`
	Code                 string    `db:"code" json:"code"`
	Description          *string   `db:"description" json:"description"`
	MeasurementType      string    `db:"measurement_type" json:"measurement_type"`
	MeasurementTypeLabel string    `db:"-" json:"measurement_type_label"`
	Unit                 *string   `db:"unit" json:"unit"`
	TargetMin            *float64  `db:"target_min" json:"target_min"`
	TargetMax            *float64  `db:"target_max" json:"target_max"`
	TargetRange          *string   `db:"-" json:"target_range"`
	Weight               int       `db:"weight" json:"weight"`
	IsActive             bool      `db:"is_active" json:"is_active"`
	CreatedAt            time.Time `db:"created_at" json:"created_at"`
	UpdatedAt            time.Time `db:"updated_at" json:"updated_at"`
}

