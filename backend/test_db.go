package main

import (
	"fmt"
	"log"
	"time"


	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func main() {
	dsn := "host=localhost port=5432 user=postgres password=Dimasw1950 dbname=administrasi sslmode=disable"
	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatalln(err)
	}
	defer db.Close()

	var shiftID int
	db.Get(&shiftID, "SELECT id FROM work_schedules LIMIT 1")

	err = AutoGenerateTest(db, 109, 1, "2026-09-01", "2026-09-30", "mon-fri", []int{shiftID}, false)
	if err != nil {
		log.Fatalln(err)
	}
	
	var count int
	db.Get(&count, "SELECT COUNT(*) FROM roster_schedules WHERE employee_id = 109")
	fmt.Println("Eko schedules count:", count)
}

func AutoGenerateTest(db *sqlx.DB, employeeID, unitID int, startDate, endDate, workDaysPattern string, workScheduleIDs []int, overwrite bool) error {
	var employeeIDs []int
	empQuery := "SELECT user_id FROM employees WHERE user_id IS NOT NULL"
	var empArgs []interface{}
	if employeeID > 0 {
		empQuery += " AND user_id = $1"
		empArgs = append(empArgs, employeeID)
	}
	
	err := db.Select(&employeeIDs, empQuery, empArgs...)
	if err != nil {
		return err
	}
	
	tx, err := db.Beginx()
	if err != nil { return err }
	defer tx.Rollback()

	start, _ := time.Parse("2006-01-02", startDate)
	end, _ := time.Parse("2006-01-02", endDate)

	var inserted int
	for _, eid := range employeeIDs {
		current := start
		for !current.After(end) {
			weekday := current.Weekday()
			shouldAssign := true
			if workDaysPattern == "mon-fri" && (weekday == time.Saturday || weekday == time.Sunday) {
				shouldAssign = false
			} else if workDaysPattern == "mon-sat" && weekday == time.Sunday {
				shouldAssign = false
			}

			if shouldAssign {
				dateStr := current.Format("2006-01-02")
				var count int
				tx.Get(&count, "SELECT COUNT(*) FROM roster_schedules WHERE employee_id = $1 AND date = $2", eid, dateStr)

				if count > 0 {
					if overwrite {
						tx.Exec("UPDATE roster_schedules SET work_schedule_id = $1, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $2 AND date = $3", workScheduleIDs[0], eid, dateStr)
						inserted++
					}
				} else {
					_, err = tx.Exec("INSERT INTO roster_schedules (employee_id, work_schedule_id, date) VALUES ($1, $2, $3)", eid, workScheduleIDs[0], dateStr)
					if err != nil { return err }
					inserted++
				}
			}
			current = current.AddDate(0, 0, 1)
		}
	}
	fmt.Println("Inserted inside tx:", inserted)
	return tx.Commit()
}
