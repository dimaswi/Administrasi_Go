package models

import "time"

type AppSetting struct {
	Key       string     `json:"key" db:"key"`
	Value     string     `json:"value" db:"value"`
	UpdatedAt *time.Time `json:"updated_at" db:"updated_at"`
}
