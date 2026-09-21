package repository

import (
	"backend/models"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

type OutgoingLetterRepository struct {
	DB *sqlx.DB
}

func NewOutgoingLetterRepository(db *sqlx.DB) *OutgoingLetterRepository {
	return &OutgoingLetterRepository{DB: db}
}

func (r *OutgoingLetterRepository) GetAll(page, perPage int, search string, status string) ([]models.OutgoingLetter, map[string]interface{}, error) {
	var letters []models.OutgoingLetter
	var total int

	offset := (page - 1) * perPage

	queryCount := "SELECT COUNT(*) FROM outgoing_letters ol WHERE ol.deleted_at IS NULL"
	querySelect := `
		SELECT ol.*, dt.name as template_name, u.name as creator_name
		FROM outgoing_letters ol
		LEFT JOIN document_templates dt ON ol.template_id = dt.id
		LEFT JOIN users u ON ol.created_by = u.id
		WHERE ol.deleted_at IS NULL
	`

	var args []interface{}
	
	if status != "" {
		whereStatus := " AND ol.status = $1"
		queryCount += whereStatus
		querySelect += whereStatus
		args = append(args, status)
	}

	if search != "" {
		searchTerm := "%" + search + "%"
		var whereClause string
		if len(args) == 0 {
			whereClause = " AND (ol.subject ILIKE $1 OR ol.letter_number ILIKE $2)"
			args = append(args, searchTerm, searchTerm)
		} else {
			whereClause = fmt.Sprintf(" AND (ol.subject ILIKE $%d OR ol.letter_number ILIKE $%d)", len(args)+1, len(args)+2)
			args = append(args, searchTerm, searchTerm)
		}
		queryCount += whereClause
		querySelect += whereClause
	}

	// Count total
	if err := r.DB.Get(&total, queryCount, args...); err != nil {
		return nil, nil, err
	}

	// Fetch data
	querySelect += fmt.Sprintf(" ORDER BY ol.id DESC LIMIT $%d OFFSET $%d", len(args)+1, len(args)+2)
	args = append(args, perPage, offset)

	if err := r.DB.Select(&letters, querySelect, args...); err != nil {
		return nil, nil, err
	}

	lastPage := (total + perPage - 1) / perPage
	paginationMeta := map[string]interface{}{
		"current_page": page,
		"last_page":    lastPage,
		"per_page":     perPage,
		"total":        total,
	}

	return letters, paginationMeta, nil
}

func (r *OutgoingLetterRepository) GetByID(id int) (*models.OutgoingLetter, error) {
	var letter models.OutgoingLetter
	query := `
		SELECT ol.*, dt.name as template_name, u.name as creator_name
		FROM outgoing_letters ol
		LEFT JOIN document_templates dt ON ol.template_id = dt.id
		LEFT JOIN users u ON ol.created_by = u.id
		WHERE ol.id = $1 AND ol.deleted_at IS NULL
	`
	err := r.DB.Get(&letter, query, id)
	if err != nil {
		return nil, err
	}

	// Fetch signatories
	var signatories []models.LetterSignatory
	sigQuery := `
		SELECT ls.*, u.name as user_name 
		FROM letter_signatories ls
		LEFT JOIN users u ON ls.user_id = u.id
		WHERE ls.letter_id = $1 ORDER BY ls.sign_order ASC
	`
	if err := r.DB.Select(&signatories, sigQuery, id); err == nil {
		letter.Signatories = signatories
	}

	return &letter, nil
}

func (r *OutgoingLetterRepository) Create(letter *models.OutgoingLetter, signatories []models.LetterSignatory) error {
	tx, err := r.DB.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Generate letter number
	var template struct {
		Code            string  `db:"code"`
		NumberingFormat *string `db:"numbering_format"`
	}
	err = tx.Get(&template, "SELECT code, numbering_format FROM document_templates WHERE id = $1", letter.TemplateID)
	if err == nil && template.Code != "" {
		var count int
		tx.Get(&count, "SELECT COUNT(*) FROM outgoing_letters WHERE extract(year from created_at) = extract(year from current_date)")
		
		nomorSurat := fmt.Sprintf("%03d", count+1)
		kodeSurat := template.Code
		bulanInt := int(time.Now().Month())
		bulanStr := fmt.Sprintf("%02d", bulanInt)
		tahunStr := fmt.Sprintf("%d", time.Now().Year())

		romawiBulan := []string{"", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"}[bulanInt]

		var num string
		if template.NumberingFormat != nil && *template.NumberingFormat != "" {
			format := *template.NumberingFormat
			// Support bracket styles: [nomor] or {nomor}
			replacer := strings.NewReplacer(
				"[nomor]", nomorSurat, "{nomor}", nomorSurat,
				"[kode]", kodeSurat, "{kode}", kodeSurat,
				"[bulan]", bulanStr, "{bulan}", bulanStr,
				"[romawi_bulan]", romawiBulan, "{romawi_bulan}", romawiBulan,
				"[tahun]", tahunStr, "{tahun}", tahunStr,
			)
			num = replacer.Replace(format)
		} else {
			// Fallback default
			num = fmt.Sprintf("%s/%s/%s/%s", nomorSurat, kodeSurat, bulanStr, tahunStr)
		}
		
		letter.LetterNumber = &num
	}

	query := `
		INSERT INTO outgoing_letters (
			template_id, incoming_letter_id, letter_number, subject, letter_date, variable_values, status, notes, created_by, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
		) RETURNING id
	`
	err = tx.QueryRowx(query,
		letter.TemplateID,
		letter.IncomingLetterID,
		letter.LetterNumber,
		letter.Subject,
		letter.LetterDate,
		letter.VariableValues,
		letter.Status,
		letter.Notes,
		letter.CreatedBy,
	).Scan(&letter.ID)

	if err != nil {
		return err
	}

	// Insert Signatories
	if len(signatories) > 0 {
		sigQuery := `
			INSERT INTO letter_signatories (
				letter_id, user_id, slot_id, sign_order, status, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, NOW(), NOW()
			)
		`
		for _, sig := range signatories {
			_, err = tx.Exec(sigQuery, letter.ID, sig.UserID, sig.SlotID, sig.SignOrder, "pending")
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit()
}
