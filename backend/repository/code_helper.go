package repository

import (
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
)

// generateAutoCode generates a unique sequential code with the given prefix
// (e.g., PREFIX-001, PREFIX-002) by checking existing records in the table.
func generateAutoCode(db *sqlx.DB, table string, prefix string) (string, error) {
	var maxID int
	err := db.Get(&maxID, fmt.Sprintf("SELECT COALESCE(MAX(id), 0) FROM %s", table))
	if err != nil {
		return "", err
	}

	seq := maxID + 1
	upperPrefix := strings.ToUpper(prefix)
	for i := 0; i < 1000; i++ {
		candidate := fmt.Sprintf("%s-%03d", upperPrefix, seq+i)
		var count int
		err := db.Get(&count, fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE code = $1", table), candidate)
		if err != nil {
			return "", err
		}
		if count == 0 {
			return candidate, nil
		}
	}
	return fmt.Sprintf("%s-%d", upperPrefix, seq+1000), nil
}
