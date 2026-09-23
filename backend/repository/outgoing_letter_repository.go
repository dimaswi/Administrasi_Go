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

	queryCount := `
		SELECT COUNT(*) FROM outgoing_letters ol
		LEFT JOIN document_templates dt ON ol.template_id = dt.id
		LEFT JOIN users u ON ol.created_by = u.id
		WHERE ol.deleted_at IS NULL
	`
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
			whereClause = " AND (ol.subject ILIKE $1 OR ol.letter_number ILIKE $2 OR dt.name ILIKE $3 OR u.name ILIKE $4)"
			args = append(args, searchTerm, searchTerm, searchTerm, searchTerm)
		} else {
			whereClause = fmt.Sprintf(" AND (ol.subject ILIKE $%d OR ol.letter_number ILIKE $%d OR dt.name ILIKE $%d OR u.name ILIKE $%d)", len(args)+1, len(args)+2, len(args)+3, len(args)+4)
			args = append(args, searchTerm, searchTerm, searchTerm, searchTerm)
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
		tx.Get(&count, "SELECT COUNT(*) FROM outgoing_letters WHERE extract(year from created_at) = extract(year from current_date) AND template_id = $1", letter.TemplateID)
		
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
				"[no]", nomorSurat, "{no}", nomorSurat,
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

func (r *OutgoingLetterRepository) Update(id int, letter *models.OutgoingLetter, signatories []models.LetterSignatory) error {
	tx, err := r.DB.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Get current letter
	var currentLetter models.OutgoingLetter
	err = tx.Get(&currentLetter, "SELECT letter_number, template_id FROM outgoing_letters WHERE id = $1", id)
	if err != nil {
		return err
	}

	newLetterNumber := currentLetter.LetterNumber

	// Check if letter_number is missing or contains {no}, [no], {nomor}, [nomor]
	if newLetterNumber == nil || *newLetterNumber == "" || strings.Contains(*newLetterNumber, "{no}") || strings.Contains(*newLetterNumber, "[no]") || strings.Contains(*newLetterNumber, "{nomor}") || strings.Contains(*newLetterNumber, "[nomor]") {
		// Regenerate letter number
		var template struct {
			Code            string  `db:"code"`
			NumberingFormat *string `db:"numbering_format"`
		}
		err = tx.Get(&template, "SELECT code, numbering_format FROM document_templates WHERE id = $1", currentLetter.TemplateID)
		if err == nil && template.Code != "" {
			var seq int
			tx.Get(&seq, "SELECT count(*) FROM outgoing_letters WHERE extract(year from created_at) = extract(year from current_date) AND template_id = $2 AND created_at <= (SELECT created_at FROM outgoing_letters WHERE id = $1)", id, currentLetter.TemplateID)
			
			nomorSuratStr := fmt.Sprintf("%03d", seq)
			kodeSurat := template.Code
			bulanInt := int(time.Now().Month())
			bulanStr := fmt.Sprintf("%02d", bulanInt)
			tahunStr := fmt.Sprintf("%d", time.Now().Year())
			romawiBulan := []string{"", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"}[bulanInt]

			var num string
			if template.NumberingFormat != nil && *template.NumberingFormat != "" {
				format := *template.NumberingFormat
				replacer := strings.NewReplacer(
					"[nomor]", nomorSuratStr, "{nomor}", nomorSuratStr,
					"[no]", nomorSuratStr, "{no}", nomorSuratStr,
					"[kode]", kodeSurat, "{kode}", kodeSurat,
					"[bulan]", bulanStr, "{bulan}", bulanStr,
					"[romawi_bulan]", romawiBulan, "{romawi_bulan}", romawiBulan,
					"[tahun]", tahunStr, "{tahun}", tahunStr,
				)
				num = replacer.Replace(format)
			} else {
				num = fmt.Sprintf("%s/%s/%s/%s", nomorSuratStr, kodeSurat, bulanStr, tahunStr)
			}
			newLetterNumber = &num
		}
	}

	query := `
		UPDATE outgoing_letters SET
			letter_number = $1, subject = $2, letter_date = $3, variable_values = $4, updated_at = NOW()
		WHERE id = $5
	`
	_, err = tx.Exec(query,
		newLetterNumber,
		letter.Subject,
		letter.LetterDate,
		letter.VariableValues,
		id,
	)

	if err != nil {
		return err
	}

	// Delete existing signatories
	_, err = tx.Exec("DELETE FROM letter_signatories WHERE letter_id = $1", id)
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
			_, err = tx.Exec(sigQuery, id, sig.UserID, sig.SlotID, sig.SignOrder, "pending")
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit()
}

func (r *OutgoingLetterRepository) UpdateStatus(id int, status string) error {
	_, err := r.DB.Exec("UPDATE outgoing_letters SET status = $1, updated_at = NOW() WHERE id = $2", status, id)
	return err
}

func (r *OutgoingLetterRepository) Sign(letterID int, userID int) error {
	tx, err := r.DB.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Update signatory
	res, err := tx.Exec("UPDATE letter_signatories SET status = 'signed', signed_at = NOW(), updated_at = NOW() WHERE letter_id = $1 AND user_id = $2 AND status = 'pending'", letterID, userID)
	if err != nil {
		return err
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("signatory not found or not pending")
	}

	// Check remaining pending
	var pendingCount int
	err = tx.Get(&pendingCount, "SELECT COUNT(*) FROM letter_signatories WHERE letter_id = $1 AND status = 'pending'", letterID)
	if err != nil {
		return err
	}

	newStatus := "partially_signed"
	if pendingCount == 0 {
		newStatus = "fully_signed"
	}

	_, err = tx.Exec("UPDATE outgoing_letters SET status = $1, updated_at = NOW() WHERE id = $2", newStatus, letterID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *OutgoingLetterRepository) Reject(letterID int, userID int, reason string) error {
	tx, err := r.DB.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Update signatory
	res, err := tx.Exec("UPDATE letter_signatories SET status = 'rejected', updated_at = NOW() WHERE letter_id = $1 AND user_id = $2 AND status = 'pending'", letterID, userID)
	if err != nil {
		return err
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("signatory not found or not pending")
	}

	// Update letter
	_, err = tx.Exec("UPDATE outgoing_letters SET status = 'rejected', revision_requested = true, revision_request_notes = $1, revision_requested_by = $2, updated_at = NOW() WHERE id = $3", reason, userID, letterID)
	if err != nil {
		return err
	}

	return tx.Commit()
}
