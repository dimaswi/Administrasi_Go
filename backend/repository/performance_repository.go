package repository

import (
	"fmt"

	"backend/models"
	"github.com/jmoiron/sqlx"
)

type PerformanceRepository struct {
	db *sqlx.DB
}

func NewPerformanceRepository(db *sqlx.DB) *PerformanceRepository {
	return &PerformanceRepository{db: db}
}

// ==================== Performance Periods ====================

func (r *PerformanceRepository) GetAllPeriods(search, typeFilter, status string) ([]models.PerformancePeriod, error) {
	query := `
		SELECT 
			pp.id, pp.name, pp.type, pp.start_date, pp.end_date, pp.status,
			pp.description, pp.is_current,
			COALESCE(COUNT(pr.id), 0) AS reviews_count,
			pp.created_at, pp.updated_at
		FROM performance_periods pp
		LEFT JOIN performance_reviews pr ON pr.period_id = pp.id
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		query += fmt.Sprintf(" AND pp.name ILIKE $%d", argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if typeFilter != "" {
		query += fmt.Sprintf(" AND pp.type = $%d", argIdx)
		args = append(args, typeFilter)
		argIdx++
	}
	if status != "" {
		query += fmt.Sprintf(" AND pp.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	query += " GROUP BY pp.id ORDER BY pp.start_date DESC"

	var list []models.PerformancePeriod
	err := r.db.Select(&list, query, args...)
	if err != nil {
		return nil, err
	}

	typeLabels := map[string]string{
		"monthly":   "Bulanan",
		"quarterly": "Triwulan",
		"semester":  "Semester",
		"yearly":    "Tahunan",
	}
	statusLabels := map[string]string{
		"draft":  "Draft",
		"active": "Aktif",
		"closed": "Selesai",
	}

	for i := range list {
		if lbl, ok := typeLabels[list[i].Type]; ok {
			list[i].TypeLabel = lbl
		} else {
			list[i].TypeLabel = list[i].Type
		}
		if lbl, ok := statusLabels[list[i].Status]; ok {
			list[i].StatusLabel = lbl
		} else {
			list[i].StatusLabel = list[i].Status
		}
	}

	return list, nil
}

func (r *PerformanceRepository) GetPeriodByID(id int) (*models.PerformancePeriod, error) {
	query := `
		SELECT 
			pp.id, pp.name, pp.type, pp.start_date, pp.end_date, pp.status,
			pp.description, pp.is_current,
			COALESCE(COUNT(pr.id), 0) AS reviews_count,
			pp.created_at, pp.updated_at
		FROM performance_periods pp
		LEFT JOIN performance_reviews pr ON pr.period_id = pp.id
		WHERE pp.id = $1
		GROUP BY pp.id
	`
	var p models.PerformancePeriod
	err := r.db.Get(&p, query, id)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PerformanceRepository) CreatePeriod(p *models.PerformancePeriod) error {
	query := `
		INSERT INTO performance_periods (
			name, type, start_date, end_date, status, description, is_current,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query,
		p.Name, p.Type, p.StartDate, p.EndDate, p.Status, p.Description, p.IsCurrent,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *PerformanceRepository) UpdatePeriod(id int, p *models.PerformancePeriod) error {
	query := `
		UPDATE performance_periods SET
			name = $1, type = $2, start_date = $3, end_date = $4, status = $5,
			description = $6, is_current = $7, updated_at = NOW()
		WHERE id = $8
	`
	_, err := r.db.Exec(query,
		p.Name, p.Type, p.StartDate, p.EndDate, p.Status,
		p.Description, p.IsCurrent, id,
	)
	return err
}

func (r *PerformanceRepository) DeletePeriod(id int) error {
	_, err := r.db.Exec("DELETE FROM performance_periods WHERE id = $1", id)
	return err
}

// ==================== Performance Reviews ====================

func (r *PerformanceRepository) GetAllReviews(search string, periodID int, status string) ([]models.PerformanceReview, error) {
	query := `
		SELECT 
			pr.id, pr.employee_id,
			CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS employee_name,
			e.employee_id AS employee_nik,
			ou.name AS organization_unit,
			pr.period_id,
			pp.name AS period_name,
			pr.reviewer_id,
			u.name AS reviewer_name,
			pr.status, pr.self_score, pr.manager_score, pr.final_score, pr.final_grade,
			pr.employee_notes, pr.manager_notes, pr.strengths, pr.improvements, pr.development_plan,
			pr.self_reviewed_at, pr.manager_reviewed_at, pr.completed_at,
			pr.created_at, pr.updated_at
		FROM performance_reviews pr
		JOIN employees e ON e.id = pr.employee_id
		JOIN performance_periods pp ON pp.id = pr.period_id
		LEFT JOIN users u ON u.id = pr.reviewer_id
		LEFT JOIN organization_units ou ON ou.id = e.organization_unit_id
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		query += fmt.Sprintf(" AND (e.first_name ILIKE $%d OR e.last_name ILIKE $%d OR e.employee_id ILIKE $%d)", argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if periodID > 0 {
		query += fmt.Sprintf(" AND pr.period_id = $%d", argIdx)
		args = append(args, periodID)
		argIdx++
	}
	if status != "" {
		query += fmt.Sprintf(" AND pr.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	query += " ORDER BY pr.updated_at DESC"

	var list []models.PerformanceReview
	err := r.db.Select(&list, query, args...)
	if err != nil {
		return nil, err
	}

	statusLabels := map[string]string{
		"draft":          "Draft",
		"self_review":    "Self Review",
		"manager_review": "Review Atasan",
		"calibration":    "Kalibrasi",
		"completed":      "Selesai",
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

func (r *PerformanceRepository) GetReviewByID(id int) (*models.PerformanceReview, error) {
	query := `
		SELECT 
			pr.id, pr.employee_id,
			CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS employee_name,
			e.employee_id AS employee_nik,
			ou.name AS organization_unit,
			pr.period_id,
			pp.name AS period_name,
			pr.reviewer_id,
			u.name AS reviewer_name,
			pr.status, pr.self_score, pr.manager_score, pr.final_score, pr.final_grade,
			pr.employee_notes, pr.manager_notes, pr.strengths, pr.improvements, pr.development_plan,
			pr.self_reviewed_at, pr.manager_reviewed_at, pr.completed_at,
			pr.created_at, pr.updated_at
		FROM performance_reviews pr
		JOIN employees e ON e.id = pr.employee_id
		JOIN performance_periods pp ON pp.id = pr.period_id
		LEFT JOIN users u ON u.id = pr.reviewer_id
		LEFT JOIN organization_units ou ON ou.id = e.organization_unit_id
		WHERE pr.id = $1
	`
	var pr models.PerformanceReview
	err := r.db.Get(&pr, query, id)
	if err != nil {
		return nil, err
	}

	itemsQuery := `
		SELECT 
			pri.id, pri.review_id, pri.template_id, pri.category_id,
			COALESCE(kc.name, '') AS category_name,
			pri.name, pri.description, pri.measurement_type, pri.unit,
			pri.target, pri.actual, pri.weight,
			pri.self_score, pri.manager_score, pri.final_score,
			pri.self_comment, pri.manager_comment,
			pri.created_at, pri.updated_at
		FROM performance_review_items pri
		LEFT JOIN kpi_categories kc ON kc.id = pri.category_id
		WHERE pri.review_id = $1
		ORDER BY pri.id ASC
	`
	var items []models.PerformanceReviewItem
	if err := r.db.Select(&items, itemsQuery, id); err == nil {
		pr.Items = items
	} else {
		pr.Items = []models.PerformanceReviewItem{}
	}

	return &pr, nil
}

func (r *PerformanceRepository) CreateReview(pr *models.PerformanceReview) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `
		INSERT INTO performance_reviews (
			employee_id, period_id, reviewer_id, status, self_score, manager_score,
			final_score, final_grade, employee_notes, manager_notes, strengths,
			improvements, development_plan, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	err = tx.QueryRow(query,
		pr.EmployeeID, pr.PeriodID, pr.ReviewerID, pr.Status, pr.SelfScore,
		pr.ManagerScore, pr.FinalScore, pr.FinalGrade, pr.EmployeeNotes,
		pr.ManagerNotes, pr.Strengths, pr.Improvements, pr.DevelopmentPlan,
	).Scan(&pr.ID, &pr.CreatedAt, &pr.UpdatedAt)
	if err != nil {
		return err
	}

	for i := range pr.Items {
		item := &pr.Items[i]
		item.ReviewID = pr.ID
		if item.Weight <= 0 {
			item.Weight = 1
		}
		if item.MeasurementType == "" {
			item.MeasurementType = "numeric"
		}
		itemQuery := `
			INSERT INTO performance_review_items (
				review_id, template_id, category_id, name, description,
				measurement_type, unit, target, actual, weight,
				self_score, manager_score, final_score, self_comment, manager_comment,
				created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5,
				$6, $7, $8, $9, $10,
				$11, $12, $13, $14, $15,
				NOW(), NOW()
			) RETURNING id, created_at, updated_at
		`
		err = tx.QueryRow(itemQuery,
			item.ReviewID, item.TemplateID, item.CategoryID, item.Name, item.Description,
			item.MeasurementType, item.Unit, item.Target, item.Actual, item.Weight,
			item.SelfScore, item.ManagerScore, item.FinalScore, item.SelfComment, item.ManagerComment,
		).Scan(&item.ID, &item.CreatedAt, &item.UpdatedAt)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *PerformanceRepository) UpdateReview(id int, pr *models.PerformanceReview) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `
		UPDATE performance_reviews SET
			employee_id = $1, period_id = $2, reviewer_id = $3, status = $4,
			self_score = $5, manager_score = $6, final_score = $7, final_grade = $8,
			employee_notes = $9, manager_notes = $10, strengths = $11,
			improvements = $12, development_plan = $13, updated_at = NOW()
		WHERE id = $14
	`
	_, err = tx.Exec(query,
		pr.EmployeeID, pr.PeriodID, pr.ReviewerID, pr.Status,
		pr.SelfScore, pr.ManagerScore, pr.FinalScore, pr.FinalGrade,
		pr.EmployeeNotes, pr.ManagerNotes, pr.Strengths,
		pr.Improvements, pr.DevelopmentPlan, id,
	)
	if err != nil {
		return err
	}

	if len(pr.Items) > 0 {
		_, err = tx.Exec("DELETE FROM performance_review_items WHERE review_id = $1", id)
		if err != nil {
			return err
		}

		for i := range pr.Items {
			item := &pr.Items[i]
			item.ReviewID = id
			if item.Weight <= 0 {
				item.Weight = 1
			}
			if item.MeasurementType == "" {
				item.MeasurementType = "numeric"
			}
			itemQuery := `
				INSERT INTO performance_review_items (
					review_id, template_id, category_id, name, description,
					measurement_type, unit, target, actual, weight,
					self_score, manager_score, final_score, self_comment, manager_comment,
					created_at, updated_at
				) VALUES (
					$1, $2, $3, $4, $5,
					$6, $7, $8, $9, $10,
					$11, $12, $13, $14, $15,
					NOW(), NOW()
				) RETURNING id, created_at, updated_at
			`
			err = tx.QueryRow(itemQuery,
				item.ReviewID, item.TemplateID, item.CategoryID, item.Name, item.Description,
				item.MeasurementType, item.Unit, item.Target, item.Actual, item.Weight,
				item.SelfScore, item.ManagerScore, item.FinalScore, item.SelfComment, item.ManagerComment,
			).Scan(&item.ID, &item.CreatedAt, &item.UpdatedAt)
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit()
}

func (r *PerformanceRepository) SubmitSelfReview(reviewID int, items []models.PerformanceReviewItem, employeeNotes *string) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var totalWeight float64 = 0
	var weightedSum float64 = 0

	for _, item := range items {
		_, err = tx.Exec(`
			UPDATE performance_review_items SET
				actual = $1, self_score = $2, self_comment = $3, updated_at = NOW()
			WHERE id = $4 AND review_id = $5
		`, item.Actual, item.SelfScore, item.SelfComment, item.ID, reviewID)
		if err != nil {
			return err
		}

		if item.SelfScore != nil && item.Weight > 0 {
			totalWeight += float64(item.Weight)
			weightedSum += (*item.SelfScore) * float64(item.Weight)
		}
	}

	var calculatedSelfScore *float64
	if totalWeight > 0 {
		score := weightedSum / totalWeight
		calculatedSelfScore = &score
	}

	_, err = tx.Exec(`
		UPDATE performance_reviews SET
			self_score = $1, employee_notes = $2, self_reviewed_at = NOW(),
			status = 'self_review', updated_at = NOW()
		WHERE id = $3
	`, calculatedSelfScore, employeeNotes, reviewID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *PerformanceRepository) SubmitManagerReview(reviewID int, reviewerID *int, items []models.PerformanceReviewItem, managerNotes, strengths, improvements, devPlan *string) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var totalWeight float64 = 0
	var weightedSum float64 = 0

	for _, item := range items {
		_, err = tx.Exec(`
			UPDATE performance_review_items SET
				manager_score = $1, final_score = $1, manager_comment = $2, updated_at = NOW()
			WHERE id = $3 AND review_id = $4
		`, item.ManagerScore, item.ManagerComment, item.ID, reviewID)
		if err != nil {
			return err
		}

		if item.ManagerScore != nil && item.Weight > 0 {
			totalWeight += float64(item.Weight)
			weightedSum += (*item.ManagerScore) * float64(item.Weight)
		}
	}

	var calculatedManagerScore *float64
	var finalGrade *string
	if totalWeight > 0 {
		score := weightedSum / totalWeight
		calculatedManagerScore = &score

		var grade string
		if score >= 90 {
			grade = "A"
		} else if score >= 80 {
			grade = "B"
		} else if score >= 70 {
			grade = "C"
		} else if score >= 60 {
			grade = "D"
		} else {
			grade = "E"
		}
		finalGrade = &grade
	}

	_, err = tx.Exec(`
		UPDATE performance_reviews SET
			manager_score = $1, final_score = $1, final_grade = $2,
			reviewer_id = $3, manager_notes = $4, strengths = $5,
			improvements = $6, development_plan = $7, manager_reviewed_at = NOW(),
			status = 'manager_review', updated_at = NOW()
		WHERE id = $8
	`, calculatedManagerScore, finalGrade, reviewerID, managerNotes, strengths, improvements, devPlan, reviewID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *PerformanceRepository) CompleteReview(reviewID int) error {
	_, err := r.db.Exec(`
		UPDATE performance_reviews SET
			status = 'completed', completed_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`, reviewID)
	return err
}

func (r *PerformanceRepository) DeleteReview(id int) error {
	_, err := r.db.Exec("DELETE FROM performance_reviews WHERE id = $1", id)
	return err
}

// ==================== 360 Feedback ====================

func (r *PerformanceRepository) GetAllFeedback360Sessions(search, status string) ([]models.Feedback360Session, error) {
	query := `
		SELECT 
			fs.id, fs.period_id, pp.name AS period_name,
			fs.name, fs.description, fs.start_date, fs.end_date, fs.status,
			COALESCE(COUNT(fp.id), 0) AS participants_count,
			fs.created_at, fs.updated_at
		FROM feedback_360_sessions fs
		LEFT JOIN performance_periods pp ON pp.id = fs.period_id
		LEFT JOIN feedback_360_participants fp ON fp.session_id = fs.id
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		query += fmt.Sprintf(" AND fs.name ILIKE $%d", argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if status != "" {
		query += fmt.Sprintf(" AND fs.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	query += " GROUP BY fs.id, pp.name ORDER BY fs.created_at DESC"

	var list []models.Feedback360Session
	err := r.db.Select(&list, query, args...)
	if err != nil {
		return nil, err
	}

	statusLabels := map[string]string{
		"draft":     "Draft",
		"active":    "Aktif / Berjalan",
		"completed": "Selesai",
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

func (r *PerformanceRepository) GetFeedback360SessionByID(id int) (*models.Feedback360Session, error) {
	query := `
		SELECT 
			fs.id, fs.period_id, pp.name AS period_name,
			fs.name, fs.description, fs.start_date, fs.end_date, fs.status,
			COALESCE(COUNT(fp.id), 0) AS participants_count,
			fs.created_at, fs.updated_at
		FROM feedback_360_sessions fs
		LEFT JOIN performance_periods pp ON pp.id = fs.period_id
		LEFT JOIN feedback_360_participants fp ON fp.session_id = fs.id
		WHERE fs.id = $1
		GROUP BY fs.id, pp.name
	`
	var fs models.Feedback360Session
	err := r.db.Get(&fs, query, id)
	if err != nil {
		return nil, err
	}
	return &fs, nil
}

func (r *PerformanceRepository) CreateFeedback360Session(fs *models.Feedback360Session) error {
	query := `
		INSERT INTO feedback_360_sessions (
			period_id, name, description, start_date, end_date, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query,
		fs.PeriodID, fs.Name, fs.Description, fs.StartDate, fs.EndDate, fs.Status,
	).Scan(&fs.ID, &fs.CreatedAt, &fs.UpdatedAt)
}

func (r *PerformanceRepository) UpdateFeedback360Session(id int, fs *models.Feedback360Session) error {
	query := `
		UPDATE feedback_360_sessions SET
			period_id = $1, name = $2, description = $3, start_date = $4,
			end_date = $5, status = $6, updated_at = NOW()
		WHERE id = $7
	`
	_, err := r.db.Exec(query,
		fs.PeriodID, fs.Name, fs.Description, fs.StartDate, fs.EndDate, fs.Status, id,
	)
	return err
}

func (r *PerformanceRepository) DeleteFeedback360Session(id int) error {
	_, err := r.db.Exec("DELETE FROM feedback_360_sessions WHERE id = $1", id)
	return err
}

// ==================== Calibration ====================

func (r *PerformanceRepository) GetAllCalibrationSessions(search, status string) ([]models.CalibrationSession, error) {
	query := `
		SELECT 
			cs.id, cs.period_id, pp.name AS period_name,
			cs.name, cs.description, cs.date, cs.status,
			COALESCE(COUNT(cr.id), 0) AS reviews_count,
			cs.created_at, cs.updated_at
		FROM calibration_sessions cs
		LEFT JOIN performance_periods pp ON pp.id = cs.period_id
		LEFT JOIN calibration_reviews cr ON cr.session_id = cs.id
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		query += fmt.Sprintf(" AND cs.name ILIKE $%d", argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if status != "" {
		query += fmt.Sprintf(" AND cs.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	query += " GROUP BY cs.id, pp.name ORDER BY cs.created_at DESC"

	var list []models.CalibrationSession
	err := r.db.Select(&list, query, args...)
	if err != nil {
		return nil, err
	}

	statusLabels := map[string]string{
		"draft":     "Draft",
		"active":    "Aktif / Sesi Dimulai",
		"completed": "Selesai",
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

func (r *PerformanceRepository) GetCalibrationSessionByID(id int) (*models.CalibrationSession, error) {
	query := `
		SELECT 
			cs.id, cs.period_id, pp.name AS period_name,
			cs.name, cs.description, cs.date, cs.status,
			COALESCE(COUNT(cr.id), 0) AS reviews_count,
			cs.created_at, cs.updated_at
		FROM calibration_sessions cs
		LEFT JOIN performance_periods pp ON pp.id = cs.period_id
		LEFT JOIN calibration_reviews cr ON cr.session_id = cs.id
		WHERE cs.id = $1
		GROUP BY cs.id, pp.name
	`
	var cs models.CalibrationSession
	err := r.db.Get(&cs, query, id)
	if err != nil {
		return nil, err
	}
	return &cs, nil
}

func (r *PerformanceRepository) CreateCalibrationSession(cs *models.CalibrationSession) error {
	query := `
		INSERT INTO calibration_sessions (
			period_id, name, description, date, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query,
		cs.PeriodID, cs.Name, cs.Description, cs.Date, cs.Status,
	).Scan(&cs.ID, &cs.CreatedAt, &cs.UpdatedAt)
}

func (r *PerformanceRepository) UpdateCalibrationSession(id int, cs *models.CalibrationSession) error {
	query := `
		UPDATE calibration_sessions SET
			period_id = $1, name = $2, description = $3, date = $4,
			status = $5, updated_at = NOW()
		WHERE id = $6
	`
	_, err := r.db.Exec(query,
		cs.PeriodID, cs.Name, cs.Description, cs.Date, cs.Status, id,
	)
	return err
}

func (r *PerformanceRepository) DeleteCalibrationSession(id int) error {
	_, err := r.db.Exec("DELETE FROM calibration_sessions WHERE id = $1", id)
	return err
}
