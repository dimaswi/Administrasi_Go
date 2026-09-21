package repository

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type EmployeeDetailRepository struct {
	db *sqlx.DB
}

func NewEmployeeDetailRepository(db *sqlx.DB) *EmployeeDetailRepository {
	return &EmployeeDetailRepository{db: db}
}

// --- Family ---

func (r *EmployeeDetailRepository) GetFamilies(employeeID int) ([]models.EmployeeFamily, error) {
	families := []models.EmployeeFamily{}
	query := "SELECT * FROM employee_families WHERE employee_id = $1 ORDER BY id ASC"
	err := r.db.Select(&families, query, employeeID)
	if families == nil {
		families = []models.EmployeeFamily{}
	}
	return families, err
}

func (r *EmployeeDetailRepository) CreateFamily(fam *models.EmployeeFamily) error {
	query := `
		INSERT INTO employee_families (
			employee_id, name, relation, nik, gender, place_of_birth, date_of_birth, 
			occupation, phone, is_emergency_contact, is_dependent, notes, created_at, updated_at
		) VALUES (
			:employee_id, :name, :relation, :nik, :gender, :place_of_birth, :date_of_birth,
			:occupation, :phone, :is_emergency_contact, :is_dependent, :notes, NOW(), NOW()
		) RETURNING id, created_at, updated_at
	`
	rows, err := r.db.NamedQuery(query, fam)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		err = rows.Scan(&fam.ID, &fam.CreatedAt, &fam.UpdatedAt)
	}
	return err
}

func (r *EmployeeDetailRepository) UpdateFamily(fam *models.EmployeeFamily) error {
	query := `
		UPDATE employee_families SET 
			name = :name, relation = :relation, nik = :nik, gender = :gender, 
			place_of_birth = :place_of_birth, date_of_birth = :date_of_birth, 
			occupation = :occupation, phone = :phone, 
			is_emergency_contact = :is_emergency_contact, is_dependent = :is_dependent, 
			notes = :notes, updated_at = NOW()
		WHERE id = :id AND employee_id = :employee_id
	`
	_, err := r.db.NamedExec(query, fam)
	return err
}

func (r *EmployeeDetailRepository) DeleteFamily(id int, employeeID int) error {
	query := "DELETE FROM employee_families WHERE id = $1 AND employee_id = $2"
	_, err := r.db.Exec(query, id, employeeID)
	return err
}

// --- Education ---

func (r *EmployeeDetailRepository) GetEducations(employeeID int) ([]models.EmployeeEducation, error) {
	educations := []models.EmployeeEducation{}
	query := `
		SELECT e.*, el.name as education_level_name 
		FROM employee_educations e
		LEFT JOIN education_levels el ON e.education_level_id = el.id
		WHERE e.employee_id = $1 
		ORDER BY e.end_year DESC NULLS LAST, e.id DESC
	`
	err := r.db.Select(&educations, query, employeeID)
	if educations == nil {
		educations = []models.EmployeeEducation{}
	}
	return educations, err
}

func (r *EmployeeDetailRepository) CreateEducation(edu *models.EmployeeEducation) error {
	query := `
		INSERT INTO employee_educations (
			employee_id, education_level_id, institution, major, start_year, end_year, 
			gpa, certificate_number, certificate_file, is_highest, notes, created_at, updated_at
		) VALUES (
			:employee_id, :education_level_id, :institution, :major, :start_year, :end_year,
			:gpa, :certificate_number, :certificate_file, :is_highest, :notes, NOW(), NOW()
		) RETURNING id, created_at, updated_at
	`
	rows, err := r.db.NamedQuery(query, edu)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		err = rows.Scan(&edu.ID, &edu.CreatedAt, &edu.UpdatedAt)
	}
	return err
}

func (r *EmployeeDetailRepository) UpdateEducation(edu *models.EmployeeEducation) error {
	query := `
		UPDATE employee_educations SET 
			education_level_id = :education_level_id, institution = :institution, 
			major = :major, start_year = :start_year, end_year = :end_year, 
			gpa = :gpa, certificate_number = :certificate_number, certificate_file = :certificate_file, 
			is_highest = :is_highest, notes = :notes, updated_at = NOW()
		WHERE id = :id AND employee_id = :employee_id
	`
	_, err := r.db.NamedExec(query, edu)
	return err
}

func (r *EmployeeDetailRepository) DeleteEducation(id int, employeeID int) error {
	query := "DELETE FROM employee_educations WHERE id = $1 AND employee_id = $2"
	_, err := r.db.Exec(query, id, employeeID)
	return err
}

// --- Work History ---

func (r *EmployeeDetailRepository) GetWorkHistories(employeeID int) ([]models.EmployeeWorkHistory, error) {
	histories := []models.EmployeeWorkHistory{}
	query := "SELECT * FROM employee_work_histories WHERE employee_id = $1 ORDER BY start_date DESC"
	err := r.db.Select(&histories, query, employeeID)
	if histories == nil {
		histories = []models.EmployeeWorkHistory{}
	}
	return histories, err
}

func (r *EmployeeDetailRepository) CreateWorkHistory(hist *models.EmployeeWorkHistory) error {
	query := `
		INSERT INTO employee_work_histories (
			employee_id, company_name, position, start_date, end_date, 
			job_description, leaving_reason, reference_contact, reference_phone, 
			created_at, updated_at
		) VALUES (
			:employee_id, :company_name, :position, :start_date, :end_date,
			:job_description, :leaving_reason, :reference_contact, :reference_phone,
			NOW(), NOW()
		) RETURNING id, created_at, updated_at
	`
	rows, err := r.db.NamedQuery(query, hist)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		err = rows.Scan(&hist.ID, &hist.CreatedAt, &hist.UpdatedAt)
	}
	return err
}

func (r *EmployeeDetailRepository) UpdateWorkHistory(hist *models.EmployeeWorkHistory) error {
	query := `
		UPDATE employee_work_histories SET 
			company_name = :company_name, position = :position, start_date = :start_date, 
			end_date = :end_date, job_description = :job_description, 
			leaving_reason = :leaving_reason, reference_contact = :reference_contact, 
			reference_phone = :reference_phone, updated_at = NOW()
		WHERE id = :id AND employee_id = :employee_id
	`
	_, err := r.db.NamedExec(query, hist)
	return err
}

func (r *EmployeeDetailRepository) DeleteWorkHistory(id int, employeeID int) error {
	query := "DELETE FROM employee_work_histories WHERE id = $1 AND employee_id = $2"
	_, err := r.db.Exec(query, id, employeeID)
	return err
}
