package repository

import (
	"backend/models"
	"math"
	"strconv"

	"github.com/jmoiron/sqlx"
)

type OrgUnitRepository struct {
	db *sqlx.DB
}

func NewOrgUnitRepository(db *sqlx.DB) *OrgUnitRepository {
	return &OrgUnitRepository{db: db}
}

func (r *OrgUnitRepository) GetAll(page int, perPage int, search string, level string) (models.PaginatedResponse, error) {
	units := []models.OrganizationUnit{}
	
	offset := (page - 1) * perPage
	
	query := "SELECT * FROM organization_units WHERE 1=1"
	countQuery := "SELECT COUNT(*) FROM organization_units WHERE 1=1"
	
	args := []interface{}{}
	argId := 1

	if search != "" {
		query += " AND (name ILIKE $" + strconv.Itoa(argId) + " OR code ILIKE $" + strconv.Itoa(argId) + ")"
		countQuery += " AND (name ILIKE $" + strconv.Itoa(argId) + " OR code ILIKE $" + strconv.Itoa(argId) + ")"
		args = append(args, "%"+search+"%")
		argId++
	}

	if level != "" {
		query += " AND level = $" + strconv.Itoa(argId)
		countQuery += " AND level = $" + strconv.Itoa(argId)
		args = append(args, level)
		argId++
	}

	// Get Total
	var total int
	err := r.db.Get(&total, countQuery, args...)
	if err != nil {
		return models.PaginatedResponse{}, err
	}

	// Add ordering and pagination
	query += " ORDER BY level, name LIMIT $" + strconv.Itoa(argId) + " OFFSET $" + strconv.Itoa(argId+1)
	args = append(args, perPage, offset)

	err = r.db.Select(&units, query, args...)
	if err != nil {
		return models.PaginatedResponse{}, err
	}

	if units == nil {
		units = []models.OrganizationUnit{}
	}

	lastPage := int(math.Ceil(float64(total) / float64(perPage)))
	if lastPage == 0 {
		lastPage = 1
	}

	from := offset + 1
	if total == 0 {
		from = 0
	}
	to := offset + len(units)

	return models.PaginatedResponse{
		Data: units,
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

func (r *OrgUnitRepository) GetByID(id int) (*models.OrganizationUnit, error) {
	var unit models.OrganizationUnit
	err := r.db.Get(&unit, "SELECT * FROM organization_units WHERE id = $1", id)
	return &unit, err
}

func (r *OrgUnitRepository) Create(unit *models.OrganizationUnit) error {
	query := `
		INSERT INTO organization_units (code, name, description, parent_id, level, head_id, is_active, created_at, updated_at)
		VALUES (:code, :name, :description, :parent_id, :level, :head_id, :is_active, :created_at, :updated_at)
		RETURNING id
	`
	rows, err := r.db.NamedQuery(query, unit)
	if err != nil {
		return err
	}
	defer rows.Close()

	if rows.Next() {
		rows.Scan(&unit.ID)
	}
	return nil
}
