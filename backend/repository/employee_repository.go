package repository

import (
	"backend/models"
	"math"
	"strconv"

	"github.com/jmoiron/sqlx"
)

type EmployeeRepository struct {
	db *sqlx.DB
}

func NewEmployeeRepository(db *sqlx.DB) *EmployeeRepository {
	return &EmployeeRepository{db: db}
}

func (r *EmployeeRepository) GetAll(page int, perPage int, search string) (models.PaginatedResponse, error) {
	var employees []models.Employee
	
	offset := (page - 1) * perPage
	
	query := "SELECT * FROM employees WHERE deleted_at IS NULL"
	countQuery := "SELECT COUNT(*) FROM employees WHERE deleted_at IS NULL"
	
	args := []interface{}{}
	argId := 1

	if search != "" {
		query += " AND (first_name ILIKE $" + strconv.Itoa(argId) + " OR employee_id ILIKE $" + strconv.Itoa(argId) + ")"
		countQuery += " AND (first_name ILIKE $" + strconv.Itoa(argId) + " OR employee_id ILIKE $" + strconv.Itoa(argId) + ")"
		args = append(args, "%"+search+"%")
		argId++
	}

	// Get Total
	var total int
	err := r.db.Get(&total, countQuery, args...)
	if err != nil {
		return models.PaginatedResponse{}, err
	}

	// Add ordering and pagination
	query += " ORDER BY id DESC LIMIT $" + strconv.Itoa(argId) + " OFFSET $" + strconv.Itoa(argId+1)
	args = append(args, perPage, offset)

	err = r.db.Select(&employees, query, args...)
	if err != nil {
		return models.PaginatedResponse{}, err
	}

	if employees == nil {
		employees = []models.Employee{}
	}

	lastPage := int(math.Ceil(float64(total) / float64(perPage)))
	if lastPage == 0 {
		lastPage = 1
	}

	from := offset + 1
	if total == 0 {
		from = 0
	}
	to := offset + len(employees)

	return models.PaginatedResponse{
		Data: employees,
		PaginationMeta: models.PaginationMeta{
			CurrentPage: page,
			LastPage:    lastPage,
			PerPage:     perPage,
			Total:       total,
			From:        from,
			To:          to,
		},
	}, nil
}

func (r *EmployeeRepository) GetByID(id int) (*models.Employee, error) {
	var emp models.Employee
	err := r.db.Get(&emp, "SELECT * FROM employees WHERE id = $1 AND deleted_at IS NULL", id)
	return &emp, err
}

func (r *EmployeeRepository) Create(emp *models.Employee) error {
	query := `
		INSERT INTO employees (
			employee_id, user_id, first_name, last_name, nik, gender, place_of_birth, date_of_birth, religion,
			marital_status, blood_type, address, city, province, postal_code, phone, phone_secondary, email,
			emergency_contact_name, emergency_contact_phone, emergency_contact_relation, job_category_id,
			employment_status_id, organization_unit_id, position, join_date, contract_start_date, contract_end_date,
			permanent_date, resign_date, resign_reason, education_level_id, education_institution, education_major,
			education_year, photo, ktp_file, npwp_number, npwp_file, bpjs_kesehatan_number, bpjs_ketenagakerjaan_number,
			bank_name, bank_account_number, bank_account_name, status, notes, created_at, updated_at
		) VALUES (
			:employee_id, :user_id, :first_name, :last_name, :nik, :gender, :place_of_birth, :date_of_birth, :religion,
			:marital_status, :blood_type, :address, :city, :province, :postal_code, :phone, :phone_secondary, :email,
			:emergency_contact_name, :emergency_contact_phone, :emergency_contact_relation, :job_category_id,
			:employment_status_id, :organization_unit_id, :position, :join_date, :contract_start_date, :contract_end_date,
			:permanent_date, :resign_date, :resign_reason, :education_level_id, :education_institution, :education_major,
			:education_year, :photo, :ktp_file, :npwp_number, :npwp_file, :bpjs_kesehatan_number, :bpjs_ketenagakerjaan_number,
			:bank_name, :bank_account_number, :bank_account_name, :status, :notes, :created_at, :updated_at
		) RETURNING id
	`
	rows, err := r.db.NamedQuery(query, emp)
	if err != nil {
		return err
	}
	defer rows.Close()

	if rows.Next() {
		rows.Scan(&emp.ID)
	}
	return nil
}

func (r *EmployeeRepository) UpdateUserID(employeeID int, userID int) error {
	_, err := r.db.Exec("UPDATE employees SET user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", userID, employeeID)
	return err
}

func (r *EmployeeRepository) Update(emp *models.Employee) error {
	query := `
		UPDATE employees SET
			employee_id = :employee_id, first_name = :first_name, last_name = :last_name, nik = :nik, gender = :gender, 
			place_of_birth = :place_of_birth, date_of_birth = :date_of_birth, religion = :religion,
			marital_status = :marital_status, blood_type = :blood_type, address = :address, city = :city, 
			province = :province, postal_code = :postal_code, phone = :phone, phone_secondary = :phone_secondary, 
			email = :email, emergency_contact_name = :emergency_contact_name, emergency_contact_phone = :emergency_contact_phone, 
			emergency_contact_relation = :emergency_contact_relation, job_category_id = :job_category_id,
			employment_status_id = :employment_status_id, organization_unit_id = :organization_unit_id, 
			position = :position, join_date = :join_date, contract_start_date = :contract_start_date, 
			contract_end_date = :contract_end_date, permanent_date = :permanent_date, resign_date = :resign_date, 
			resign_reason = :resign_reason, education_level_id = :education_level_id, education_institution = :education_institution, 
			education_major = :education_major, education_year = :education_year, photo = :photo, ktp_file = :ktp_file, 
			npwp_number = :npwp_number, npwp_file = :npwp_file, bpjs_kesehatan_number = :bpjs_kesehatan_number, 
			bpjs_ketenagakerjaan_number = :bpjs_ketenagakerjaan_number, bank_name = :bank_name, 
			bank_account_number = :bank_account_number, bank_account_name = :bank_account_name, status = :status, 
			notes = :notes, updated_at = :updated_at
		WHERE id = :id
	`
	_, err := r.db.NamedExec(query, emp)
	return err
}
