package repository

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type SettingRepository struct {
	db *sqlx.DB
}

func NewSettingRepository(db *sqlx.DB) *SettingRepository {
	return &SettingRepository{db: db}
}

func (r *SettingRepository) GetAll() (map[string]string, error) {
	var settings []models.AppSetting
	err := r.db.Select(&settings, "SELECT * FROM app_settings")
	if err != nil {
		return nil, err
	}

	result := make(map[string]string)
	for _, s := range settings {
		result[s.Key] = s.Value
	}
	return result, nil
}

func (r *SettingRepository) GetByKey(key string) (string, error) {
	var value string
	err := r.db.Get(&value, "SELECT value FROM app_settings WHERE key = $1", key)
	if err != nil {
		return "", err
	}
	return value, nil
}

func (r *SettingRepository) Upsert(key string, value string) error {
	query := `
		INSERT INTO app_settings (key, value)
		VALUES ($1, $2)
		ON CONFLICT (key) DO UPDATE
		SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
	`
	_, err := r.db.Exec(query, key, value)
	return err
}
