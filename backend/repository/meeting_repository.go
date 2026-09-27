package repository

import (
	"backend/models"
	"time"

	"github.com/jmoiron/sqlx"
)

type MeetingRepository struct {
	db *sqlx.DB
}

func NewMeetingRepository(db *sqlx.DB) *MeetingRepository {
	return &MeetingRepository{db: db}
}

func (r *MeetingRepository) GetAll() ([]models.Meeting, error) {
	meetings := []models.Meeting{}
	err := r.db.Select(&meetings, "SELECT * FROM meetings ORDER BY meeting_date DESC, start_time DESC")
	if err != nil {
		return nil, err
	}

	for i := range meetings {
		if meetings[i].RoomID != nil {
			var room models.Room
			if err := r.db.Get(&room, "SELECT * FROM rooms WHERE id = $1", *meetings[i].RoomID); err == nil {
				meetings[i].Room = &room
			}
		}
		if meetings[i].OrganizerID != nil {
			var org models.User
			if err := r.db.Get(&org, "SELECT id, name, nip, role_id FROM users WHERE id = $1", *meetings[i].OrganizerID); err == nil {
				meetings[i].Organizer = &org
			}
		}
		if meetings[i].OrganizationUnitID != nil {
			var ou models.OrganizationUnit
			if err := r.db.Get(&ou, "SELECT * FROM organization_units WHERE id = $1", *meetings[i].OrganizationUnitID); err == nil {
				meetings[i].OrganizationUnit = &ou
			}
		}
	}

	return meetings, nil
}

func (r *MeetingRepository) GetByUserID(userID int) ([]models.Meeting, error) {
	meetings := []models.Meeting{}
	query := `
		SELECT DISTINCT m.* 
		FROM meetings m 
		LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id 
		WHERE m.organizer_id = $1 OR mp.user_id = $1 
		ORDER BY m.meeting_date DESC, m.start_time DESC
	`
	err := r.db.Select(&meetings, query, userID)
	if err != nil {
		return nil, err
	}

	for i := range meetings {
		if meetings[i].RoomID != nil {
			var room models.Room
			if err := r.db.Get(&room, "SELECT * FROM rooms WHERE id = $1", *meetings[i].RoomID); err == nil {
				meetings[i].Room = &room
			}
		}
		if meetings[i].OrganizerID != nil {
			var org models.User
			if err := r.db.Get(&org, "SELECT id, name, nip, role_id FROM users WHERE id = $1", *meetings[i].OrganizerID); err == nil {
				meetings[i].Organizer = &org
			}
		}
		if meetings[i].OrganizationUnitID != nil {
			var ou models.OrganizationUnit
			if err := r.db.Get(&ou, "SELECT * FROM organization_units WHERE id = $1", *meetings[i].OrganizationUnitID); err == nil {
				meetings[i].OrganizationUnit = &ou
			}
		}
	}

	return meetings, nil
}

func (r *MeetingRepository) GetByID(id int) (*models.Meeting, error) {
	var meeting models.Meeting
	err := r.db.Get(&meeting, "SELECT * FROM meetings WHERE id = $1 LIMIT 1", id)
	if err == nil {
		if meeting.RoomID != nil {
			var room models.Room
			r.db.Get(&room, "SELECT * FROM rooms WHERE id = $1", *meeting.RoomID)
			meeting.Room = &room
		}
		if meeting.OrganizerID != nil {
			var org models.User
			r.db.Get(&org, "SELECT id, name, nip, password, role_id, remember_token, created_at, updated_at FROM users WHERE id = $1", *meeting.OrganizerID)
			meeting.Organizer = &org
		}
		if meeting.OrganizationUnitID != nil {
			var ou models.OrganizationUnit
			r.db.Get(&ou, "SELECT * FROM organization_units WHERE id = $1", *meeting.OrganizationUnitID)
			meeting.OrganizationUnit = &ou
		}
	}
	return &meeting, err
}

func (r *MeetingRepository) Create(meeting *models.Meeting) error {
	if meeting.CheckinTokenDuration == nil || *meeting.CheckinTokenDuration == 0 {
		defDur := 5
		meeting.CheckinTokenDuration = &defDur
	}

	query := `
		INSERT INTO meetings (meeting_number, title, agenda, meeting_date, start_time, end_time, room_id, organizer_id, organization_unit_id, incoming_letter_id, status, notes, minutes_of_meeting, memo_content, checkin_token, checkin_token_expires_at, checkin_token_duration, created_at, updated_at)
		VALUES (:meeting_number, :title, :agenda, :meeting_date, :start_time, :end_time, :room_id, :organizer_id, :organization_unit_id, :incoming_letter_id, :status, :notes, :minutes_of_meeting, :memo_content, :checkin_token, :checkin_token_expires_at, :checkin_token_duration, :created_at, :updated_at)
		RETURNING id
	`
	rows, err := r.db.NamedQuery(query, meeting)
	if err != nil {
		return err
	}
	defer rows.Close()

	if rows.Next() {
		rows.Scan(&meeting.ID)
	}
	return nil
}

func (r *MeetingRepository) Update(meeting *models.Meeting) error {
	query := `
		UPDATE meetings 
		SET title = :title, agenda = :agenda, meeting_date = :meeting_date, start_time = :start_time, end_time = :end_time, room_id = :room_id, organizer_id = :organizer_id, organization_unit_id = :organization_unit_id, status = :status, notes = :notes, minutes_of_meeting = :minutes_of_meeting, memo_content = :memo_content, updated_at = :updated_at
		WHERE id = :id
	`
	_, err := r.db.NamedExec(query, meeting)
	return err
}

func (r *MeetingRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM meetings WHERE id = $1", id)
	return err
}

// Lifecycle
func (r *MeetingRepository) UpdateStatus(id int, status string) error {
	_, err := r.db.Exec("UPDATE meetings SET status = $1, updated_at = NOW() WHERE id = $2", status, id)
	return err
}

func (r *MeetingRepository) MarkAbsentForUnattended(meetingID int) error {
	_, err := r.db.Exec("UPDATE meeting_participants SET attendance_status = 'absent', updated_at = NOW() WHERE meeting_id = $1 AND attendance_status IN ('invited', 'confirmed')", meetingID)
	return err
}

// Participants
func (r *MeetingRepository) GetParticipants(meetingID int) ([]models.MeetingParticipant, error) {
	var participants []models.MeetingParticipant
	err := r.db.Select(&participants, "SELECT * FROM meeting_participants WHERE meeting_id = $1 ORDER BY created_at ASC", meetingID)
	if err == nil {
		for i := range participants {
			var u models.User
			r.db.Get(&u, "SELECT id, name, nip, password, role_id, remember_token, created_at, updated_at FROM users WHERE id = $1", participants[i].UserID)
			
			var emp models.Employee
			errEmp := r.db.Get(&emp, "SELECT * FROM employees WHERE user_id = $1 LIMIT 1", u.ID)
			if errEmp == nil && emp.OrganizationUnitID != nil {
				var ou models.OrganizationUnit
				r.db.Get(&ou, "SELECT * FROM organization_units WHERE id = $1", *emp.OrganizationUnitID)
				u.OrganizationUnit = &ou
			}
			
			participants[i].User = &u
		}
	}
	return participants, err
}

func (r *MeetingRepository) AddParticipant(p *models.MeetingParticipant) error {
	query := `INSERT INTO meeting_participants (meeting_id, user_id, role, attendance_status, created_at, updated_at)
		VALUES (:meeting_id, :user_id, :role, :attendance_status, NOW(), NOW())
		ON CONFLICT (meeting_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW()`
	_, err := r.db.NamedExec(query, p)
	return err
}

func (r *MeetingRepository) RemoveParticipant(meetingID int, userID int) error {
	_, err := r.db.Exec("DELETE FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2", meetingID, userID)
	return err
}

func (r *MeetingRepository) UpdateAttendance(meetingID int, participantID int, status string) error {
	_, err := r.db.Exec("UPDATE meeting_participants SET attendance_status = $1, updated_at = NOW() WHERE id = $2 AND meeting_id = $3", status, participantID, meetingID)
	return err
}

// Action Items
func (r *MeetingRepository) GetActionItems(meetingID int) ([]models.MeetingActionItem, error) {
	var items []models.MeetingActionItem
	err := r.db.Select(&items, "SELECT * FROM meeting_action_items WHERE meeting_id = $1 ORDER BY created_at ASC", meetingID)
	return items, err
}

func (r *MeetingRepository) CreateActionItem(item *models.MeetingActionItem) error {
	query := `
		INSERT INTO meeting_action_items (meeting_id, title, description, assigned_to, deadline, priority, status, notes, created_at, updated_at)
		VALUES (:meeting_id, :title, :description, :assigned_to, :deadline, :priority, :status, :notes, NOW(), NOW())
		RETURNING id
	`
	rows, err := r.db.NamedQuery(query, item)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		rows.Scan(&item.ID)
	}
	return nil
}

func (r *MeetingRepository) UpdateActionItem(item *models.MeetingActionItem) error {
	query := `
		UPDATE meeting_action_items 
		SET title = :title, description = :description, assigned_to = :assigned_to, deadline = :deadline, priority = :priority, status = :status, notes = :notes, updated_at = NOW()
		WHERE id = :id AND meeting_id = :meeting_id
	`
	_, err := r.db.NamedExec(query, item)
	return err
}

func (r *MeetingRepository) DeleteActionItem(id int, meetingID int) error {
	_, err := r.db.Exec("DELETE FROM meeting_action_items WHERE id = $1 AND meeting_id = $2", id, meetingID)
	return err
}

func (r *MeetingRepository) CheckInParticipant(meetingID int, userID int) error {
	res, err := r.db.Exec("UPDATE meeting_participants SET attendance_status = 'attended', check_in_time = NOW(), updated_at = NOW() WHERE meeting_id = $1 AND user_id = $2", meetingID, userID)
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		_, err = r.db.Exec("INSERT INTO meeting_participants (meeting_id, user_id, role, attendance_status, check_in_time, created_at, updated_at) VALUES ($1, $2, 'attendee', 'attended', NOW(), NOW(), NOW()) ON CONFLICT DO NOTHING", meetingID, userID)
		return err
	}
	return nil
}

func (r *MeetingRepository) UpdateMemo(meetingID int, memo string) error {
	_, err := r.db.Exec("UPDATE meetings SET memo_content = $1, updated_at = NOW() WHERE id = $2", memo, meetingID)
	return err
}

func (r *MeetingRepository) SaveCheckinToken(meetingID int, token string, durationMin int) error {
	expiresAt := time.Now().Add(time.Duration(durationMin) * time.Minute)
	_, err := r.db.Exec(
		"UPDATE meetings SET checkin_token = $1, checkin_token_expires_at = $2, checkin_token_duration = $3, updated_at = NOW() WHERE id = $4",
		token, expiresAt, durationMin, meetingID,
	)
	return err
}

func (r *MeetingRepository) GetByCheckinToken(token string) (*models.Meeting, error) {
	var meeting models.Meeting
	err := r.db.Get(&meeting, "SELECT * FROM meetings WHERE checkin_token = $1 AND checkin_token_expires_at > NOW() LIMIT 1", token)
	if err != nil {
		return nil, err
	}
	return &meeting, nil
}

func (r *MeetingRepository) PopulateUserAttendance(meetings []models.Meeting, userID int) {
	if userID == 0 || len(meetings) == 0 {
		return
	}
	type AttRow struct {
		MeetingID        int    `db:"meeting_id"`
		AttendanceStatus string `db:"attendance_status"`
	}
	var attRows []AttRow
	query := "SELECT meeting_id, attendance_status FROM meeting_participants WHERE user_id = $1"
	if err := r.db.Select(&attRows, query, userID); err == nil {
		attMap := make(map[int]string)
		for _, row := range attRows {
			attMap[row.MeetingID] = row.AttendanceStatus
		}
		for i := range meetings {
			if status, ok := attMap[meetings[i].ID]; ok {
				statusCopy := status
				meetings[i].UserAttendanceStatus = &statusCopy
				meetings[i].IsCheckedIn = (status == "attended")
			}
		}
	}
}

func (r *MeetingRepository) PopulateSingleUserAttendance(meeting *models.Meeting, userID int) {
	if userID == 0 || meeting == nil {
		return
	}
	var status string
	query := "SELECT attendance_status FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2 LIMIT 1"
	if err := r.db.Get(&status, query, meeting.ID, userID); err == nil {
		meeting.UserAttendanceStatus = &status
		meeting.IsCheckedIn = (status == "attended")
	}
}

