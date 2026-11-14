package repository

import (
	"fmt"
	"strings"

	"backend/models"
	"github.com/jmoiron/sqlx"
)

type TrainingRepository struct {
	db *sqlx.DB
}

func NewTrainingRepository(db *sqlx.DB) *TrainingRepository {
	return &TrainingRepository{db: db}
}

// ==================== Training Program ====================

func (r *TrainingRepository) GetAllTrainings(search, typeFilter, category, status string) ([]models.Training, error) {
	query := `
		SELECT 
			t.id, t.code, t.name, t.description, t.type, t.category, t.provider,
			t.duration_hours, t.cost, t.location, t.is_mandatory, t.is_active,
			t.objectives, t.prerequisites,
			COALESCE(COUNT(et.id), 0) AS participants_count,
			t.created_at, t.updated_at
		FROM trainings t
		LEFT JOIN employee_trainings et ON et.training_id = t.id
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		query += fmt.Sprintf(" AND (t.code ILIKE $%d OR t.name ILIKE $%d OR t.provider ILIKE $%d)", argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if typeFilter != "" {
		query += fmt.Sprintf(" AND t.type = $%d", argIdx)
		args = append(args, typeFilter)
		argIdx++
	}
	if category != "" {
		query += fmt.Sprintf(" AND t.category = $%d", argIdx)
		args = append(args, category)
		argIdx++
	}
	if status == "active" {
		query += " AND t.is_active = true"
	} else if status == "inactive" {
		query += " AND t.is_active = false"
	} else if status == "mandatory" {
		query += " AND t.is_mandatory = true"
	}

	query += " GROUP BY t.id ORDER BY t.created_at DESC"

	var list []models.Training
	err := r.db.Select(&list, query, args...)
	if err != nil {
		return nil, err
	}

	typeLabels := map[string]string{
		"internal":      "Internal Training",
		"external":      "External Training",
		"online":        "Online Course",
		"certification": "Sertifikasi",
		"workshop":      "Workshop",
		"seminar":       "Seminar",
	}
	categoryLabels := map[string]string{
		"technical":   "Technical Skill",
		"soft_skill":  "Soft Skill",
		"leadership":  "Leadership",
		"compliance":  "Compliance",
		"safety":      "Safety & Health",
		"product":     "Product Knowledge",
		"other":       "Lainnya",
	}

	for i := range list {
		if lbl, ok := typeLabels[list[i].Type]; ok {
			list[i].TypeLabel = lbl
		} else {
			list[i].TypeLabel = list[i].Type
		}
		if list[i].Category != nil {
			if lbl, ok := categoryLabels[*list[i].Category]; ok {
				list[i].CategoryLabel = lbl
			} else {
				list[i].CategoryLabel = *list[i].Category
			}
		}
	}

	return list, nil
}

func (r *TrainingRepository) GetTrainingByID(id int) (*models.Training, error) {
	query := `
		SELECT 
			t.id, t.code, t.name, t.description, t.type, t.category, t.provider,
			t.duration_hours, t.cost, t.location, t.is_mandatory, t.is_active,
			t.objectives, t.prerequisites,
			COALESCE(COUNT(et.id), 0) AS participants_count,
			t.created_at, t.updated_at
		FROM trainings t
		LEFT JOIN employee_trainings et ON et.training_id = t.id
		WHERE t.id = $1
		GROUP BY t.id
	`
	var t models.Training
	err := r.db.Get(&t, query, id)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TrainingRepository) CreateTraining(t *models.Training) error {
	if strings.TrimSpace(t.Code) == "" {
		code, err := generateAutoCode(r.db, "trainings", "TRN")
		if err != nil {
			return err
		}
		t.Code = code
	}
	query := `
		INSERT INTO trainings (
			code, name, description, type, category, provider, duration_hours,
			cost, location, is_mandatory, is_active, objectives, prerequisites,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query,
		t.Code, t.Name, t.Description, t.Type, t.Category, t.Provider,
		t.DurationHours, t.Cost, t.Location, t.IsMandatory, t.IsActive,
		t.Objectives, t.Prerequisites,
	).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
}

func (r *TrainingRepository) UpdateTraining(id int, t *models.Training) error {
	query := `
		UPDATE trainings SET
			code = $1, name = $2, description = $3, type = $4, category = $5,
			provider = $6, duration_hours = $7, cost = $8, location = $9,
			is_mandatory = $10, is_active = $11, objectives = $12, prerequisites = $13,
			updated_at = NOW()
		WHERE id = $14
	`
	_, err := r.db.Exec(query,
		t.Code, t.Name, t.Description, t.Type, t.Category,
		t.Provider, t.DurationHours, t.Cost, t.Location,
		t.IsMandatory, t.IsActive, t.Objectives, t.Prerequisites,
		id,
	)
	return err
}

func (r *TrainingRepository) DeleteTraining(id int) error {
	_, err := r.db.Exec("DELETE FROM trainings WHERE id = $1", id)
	return err
}

// ==================== Employee Training (Peserta) ====================

func (r *TrainingRepository) GetAllEmployeeTrainings(search string, trainingID int, status string) ([]models.EmployeeTraining, error) {
	query := `
		SELECT 
			et.id, et.employee_id,
			CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS employee_name,
			e.employee_id AS employee_nik,
			ou.name AS organization_unit,
			et.training_id,
			t.code AS training_code,
			t.name AS training_name,
			et.status, et.start_date, et.end_date, et.completion_date,
			et.score, et.grade, et.certificate_number, et.certificate_path, et.certificate_expiry,
			et.feedback, et.rating, et.notes, et.approved_by, et.approved_at,
			et.created_at, et.updated_at
		FROM employee_trainings et
		JOIN employees e ON e.id = et.employee_id
		JOIN trainings t ON t.id = et.training_id
		LEFT JOIN organization_units ou ON ou.id = e.organization_unit_id
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		query += fmt.Sprintf(" AND (e.first_name ILIKE $%d OR e.last_name ILIKE $%d OR e.employee_id ILIKE $%d OR t.name ILIKE $%d)", argIdx, argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if trainingID > 0 {
		query += fmt.Sprintf(" AND et.training_id = $%d", argIdx)
		args = append(args, trainingID)
		argIdx++
	}
	if status != "" {
		query += fmt.Sprintf(" AND et.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	query += " ORDER BY et.updated_at DESC"

	var list []models.EmployeeTraining
	err := r.db.Select(&list, query, args...)
	if err != nil {
		return nil, err
	}

	statusLabels := map[string]string{
		"registered":  "Terdaftar",
		"in_progress": "Sedang Berjalan",
		"completed":   "Selesai",
		"failed":      "Tidak Lulus",
		"cancelled":   "Dibatalkan",
	}

	for i := range list {
		if lbl, ok := statusLabels[list[i].Status]; ok {
			list[i].StatusLabel = lbl
		} else {
			list[i].StatusLabel = list[i].Status
		}
	}

	return list, nil
}

func (r *TrainingRepository) GetEmployeeTrainingByID(id int) (*models.EmployeeTraining, error) {
	query := `
		SELECT 
			et.id, et.employee_id,
			CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS employee_name,
			e.employee_id AS employee_nik,
			ou.name AS organization_unit,
			et.training_id,
			t.code AS training_code,
			t.name AS training_name,
			et.status, et.start_date, et.end_date, et.completion_date,
			et.score, et.grade, et.certificate_number, et.certificate_path, et.certificate_expiry,
			et.feedback, et.rating, et.notes, et.approved_by, et.approved_at,
			et.created_at, et.updated_at
		FROM employee_trainings et
		JOIN employees e ON e.id = et.employee_id
		JOIN trainings t ON t.id = et.training_id
		LEFT JOIN organization_units ou ON ou.id = e.organization_unit_id
		WHERE et.id = $1
	`
	var et models.EmployeeTraining
	err := r.db.Get(&et, query, id)
	if err != nil {
		return nil, err
	}
	return &et, nil
}

func (r *TrainingRepository) CreateEmployeeTraining(et *models.EmployeeTraining) error {
	query := `
		INSERT INTO employee_trainings (
			employee_id, training_id, status, start_date, end_date, completion_date,
			score, grade, certificate_number, certificate_path, certificate_expiry,
			feedback, rating, notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query,
		et.EmployeeID, et.TrainingID, et.Status, et.StartDate, et.EndDate, et.CompletionDate,
		et.Score, et.Grade, et.CertificateNumber, et.CertificatePath, et.CertificateExpiry,
		et.Feedback, et.Rating, et.Notes,
	).Scan(&et.ID, &et.CreatedAt, &et.UpdatedAt)
}

func (r *TrainingRepository) UpdateEmployeeTraining(id int, et *models.EmployeeTraining) error {
	query := `
		UPDATE employee_trainings SET
			employee_id = $1, training_id = $2, status = $3, start_date = $4, end_date = $5,
			completion_date = $6, score = $7, grade = $8, certificate_number = $9,
			certificate_path = $10, certificate_expiry = $11, feedback = $12, rating = $13,
			notes = $14, updated_at = NOW()
		WHERE id = $15
	`
	_, err := r.db.Exec(query,
		et.EmployeeID, et.TrainingID, et.Status, et.StartDate, et.EndDate,
		et.CompletionDate, et.Score, et.Grade, et.CertificateNumber,
		et.CertificatePath, et.CertificateExpiry, et.Feedback, et.Rating,
		et.Notes, id,
	)
	return err
}

func (r *TrainingRepository) DeleteEmployeeTraining(id int) error {
	_, err := r.db.Exec("DELETE FROM employee_trainings WHERE id = $1", id)
	return err
}
