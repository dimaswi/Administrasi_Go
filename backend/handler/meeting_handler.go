package handler

import (
	"backend/models"
	"backend/repository"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jung-kurt/gofpdf"
)

type MeetingHandler struct {
	repo *repository.MeetingRepository
}

func NewMeetingHandler(repo *repository.MeetingRepository) *MeetingHandler {
	return &MeetingHandler{repo: repo}
}

func (h *MeetingHandler) GetAll(c *gin.Context) {
	meetings, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, meetings)
}

func (h *MeetingHandler) GetByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	meeting, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meeting not found"})
		return
	}
	c.JSON(http.StatusOK, meeting)
}

func (h *MeetingHandler) Create(c *gin.Context) {
	var meeting models.Meeting
	if err := c.ShouldBindJSON(&meeting); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	meeting.CreatedAt = &now
	meeting.UpdatedAt = &now

	if err := h.repo.Create(&meeting); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, meeting)
}

func (h *MeetingHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var meeting models.Meeting
	if err := c.ShouldBindJSON(&meeting); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	meeting.ID = id
	now := time.Now()
	meeting.UpdatedAt = &now

	if err := h.repo.Update(&meeting); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, meeting)
}

func (h *MeetingHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.repo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Meeting deleted"})
}

// Lifecycle
func (h *MeetingHandler) StartMeeting(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.repo.UpdateStatus(id, "ongoing"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Meeting started"})
}

func (h *MeetingHandler) CompleteMeeting(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.repo.UpdateStatus(id, "completed"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.repo.MarkAbsentForUnattended(id)
	c.JSON(http.StatusOK, gin.H{"message": "Meeting completed"})
}

func (h *MeetingHandler) CancelMeeting(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.repo.UpdateStatus(id, "cancelled"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Meeting cancelled"})
}

// Participants
func (h *MeetingHandler) GetParticipants(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	participants, err := h.repo.GetParticipants(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, participants)
}

func (h *MeetingHandler) AddParticipant(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var p models.MeetingParticipant
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	p.MeetingID = id
	if err := h.repo.AddParticipant(&p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *MeetingHandler) RemoveParticipant(c *gin.Context) {
	meetingID, _ := strconv.Atoi(c.Param("id"))
	participantID, _ := strconv.Atoi(c.Param("participantId"))
	if err := h.repo.RemoveParticipant(meetingID, participantID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Participant removed"})
}

func (h *MeetingHandler) UpdateAttendance(c *gin.Context) {
	meetingID, _ := strconv.Atoi(c.Param("id"))
	participantID, _ := strconv.Atoi(c.Param("participantId"))

	var req struct {
		AttendanceStatus string `json:"attendance_status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.UpdateAttendance(meetingID, participantID, req.AttendanceStatus); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Attendance updated"})
}

// Action Items
func (h *MeetingHandler) GetActionItems(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	items, err := h.repo.GetActionItems(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *MeetingHandler) CreateActionItem(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var item models.MeetingActionItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.MeetingID = id
	if item.Status == "" {
		item.Status = "todo"
	}
	if item.Priority == "" {
		item.Priority = "medium"
	}
	if err := h.repo.CreateActionItem(&item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *MeetingHandler) UpdateActionItem(c *gin.Context) {
	meetingID, _ := strconv.Atoi(c.Param("id"))
	itemID, _ := strconv.Atoi(c.Param("itemId"))

	var item models.MeetingActionItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.ID = itemID
	item.MeetingID = meetingID

	if err := h.repo.UpdateActionItem(&item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *MeetingHandler) DeleteActionItem(c *gin.Context) {
	meetingID, _ := strconv.Atoi(c.Param("id"))
	itemID, _ := strconv.Atoi(c.Param("itemId"))

	if err := h.repo.DeleteActionItem(itemID, meetingID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// Attendance & Memo
func (h *MeetingHandler) CheckIn(c *gin.Context) {
	meetingID, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		UserID int `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		req.UserID = 1
	}

	if err := h.repo.CheckInParticipant(meetingID, req.UserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Check-in successful"})
}

func (h *MeetingHandler) CheckInByToken(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token required"})
		return
	}

	meeting, err := h.repo.GetByCheckinToken(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Token tidak valid atau sudah kedaluwarsa"})
		return
	}

	var req struct {
		UserID int `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.UserID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id required"})
		return
	}

	if err := h.repo.CheckInParticipant(meeting.ID, req.UserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Check-in berhasil", "meeting_title": meeting.Title})
}

func (h *MeetingHandler) UpdateMemo(c *gin.Context) {
	meetingID, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		MemoContent string `json:"memo_content"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.UpdateMemo(meetingID, req.MemoContent); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Memo updated"})
}

// QR Code Token
func (h *MeetingHandler) GenerateCheckinToken(c *gin.Context) {
	meetingID, _ := strconv.Atoi(c.Param("id"))

	var req struct {
		DurationMinutes int `json:"duration_minutes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.DurationMinutes == 0 {
		req.DurationMinutes = 60
	}

	token := uuid.New().String()
	if err := h.repo.SaveCheckinToken(meetingID, token, req.DurationMinutes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":            token,
		"duration_minutes": req.DurationMinutes,
		"checkin_url":      fmt.Sprintf("http://localhost:5173/checkin?token=%s", token),
	})
}

// ─── PDF Helpers ─────────────────────────────────────────────────────────────

func strVal(s *string) string {
	if s == nil {
		return "-"
	}
	return *s
}

func formatMeetingDate(dateStr string) string {
	if dateStr == "" {
		return "-"
	}
	// Try to parse ISO date
	for _, layout := range []string{"2006-01-02T15:04:05Z07:00", "2006-01-02"} {
		if t, err := time.Parse(layout, dateStr[:min(len(dateStr), len(layout))]); err == nil {
			days := []string{"Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"}
			months := []string{"", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"}
			return fmt.Sprintf("%s, %02d %s %d", days[t.Weekday()], t.Day(), months[int(t.Month())], t.Year())
		}
	}
	return dateStr
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func formatTime5(t string) string {
	if len(t) >= 5 {
		return t[:5]
	}
	return t
}

func newPDF(title string) *gofpdf.Fpdf {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(20, 20, 20)
	pdf.SetAutoPageBreak(true, 20)
	pdf.AddPage()

	// Header line
	pdf.SetDrawColor(30, 64, 175)
	pdf.SetLineWidth(0.8)
	pdf.Line(20, 18, 190, 18)
	pdf.Line(20, 19.2, 190, 19.2)

	// Title
	pdf.SetFont("Arial", "B", 14)
	pdf.SetTextColor(30, 64, 175)
	pdf.SetXY(20, 22)
	pdf.CellFormat(170, 8, strings.ToUpper(title), "", 1, "C", false, 0, "")

	pdf.SetDrawColor(30, 64, 175)
	pdf.Line(20, 33, 190, 33)
	pdf.Ln(4)

	pdf.SetTextColor(0, 0, 0)
	return pdf
}

func addInfoRow(pdf *gofpdf.Fpdf, label, value string) {
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(55, 7, label, "", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(5, 7, ":", "", 0, "L", false, 0, "")
	pdf.CellFormat(110, 7, value, "", 1, "L", false, 0, "")
}

// ─── PDF Generators ───────────────────────────────────────────────────────────

func (h *MeetingHandler) GenerateInvitation(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	meeting, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meeting not found"})
		return
	}
	participants, _ := h.repo.GetParticipants(id)

	pdf := newPDF("UNDANGAN RAPAT")

	pdf.SetFont("Arial", "", 10)
	pdf.SetXY(20, 38)
	addInfoRow(pdf, "Nomor Rapat", strVal(meeting.MeetingNumber))
	addInfoRow(pdf, "Perihal", meeting.Title)
	addInfoRow(pdf, "Tanggal", formatMeetingDate(meeting.MeetingDate))
	addInfoRow(pdf, "Waktu", fmt.Sprintf("%s - %s WIB", formatTime5(meeting.StartTime), formatTime5(meeting.EndTime)))
	if meeting.Room != nil {
		addInfoRow(pdf, "Tempat", meeting.Room.Name)
	}
	if meeting.Agenda != nil {
		addInfoRow(pdf, "Agenda", strVal(meeting.Agenda))
	}
	if meeting.Organizer != nil {
		addInfoRow(pdf, "Penyelenggara", meeting.Organizer.Name)
	}

	pdf.Ln(6)
	pdf.SetFont("Arial", "", 10)
	pdf.MultiCell(170, 6, "Dengan hormat, kami mengundang Bapak/Ibu untuk hadir dalam rapat tersebut di atas. Demikian undangan ini kami sampaikan, atas perhatian dan kehadiran Bapak/Ibu kami ucapkan terima kasih.", "", "L", false)

	// Participants table
	if len(participants) > 0 {
		pdf.Ln(6)
		pdf.SetFont("Arial", "B", 11)
		pdf.CellFormat(170, 8, "Daftar Undangan", "", 1, "L", false, 0, "")
		pdf.SetLineWidth(0.3)
		pdf.SetDrawColor(150, 150, 150)

		// Table header
		pdf.SetFillColor(30, 64, 175)
		pdf.SetTextColor(255, 255, 255)
		pdf.SetFont("Arial", "B", 9)
		pdf.CellFormat(10, 7, "No", "1", 0, "C", true, 0, "")
		pdf.CellFormat(80, 7, "Nama", "1", 0, "C", true, 0, "")
		pdf.CellFormat(50, 7, "Jabatan/Unit", "1", 0, "C", true, 0, "")
		pdf.CellFormat(30, 7, "Peran", "1", 1, "C", true, 0, "")

		pdf.SetTextColor(0, 0, 0)
		pdf.SetFont("Arial", "", 9)
		for i, p := range participants {
			fill := i%2 == 0
			if fill {
				pdf.SetFillColor(240, 245, 255)
			} else {
				pdf.SetFillColor(255, 255, 255)
			}
			name := "-"
			unit := "-"
			if p.User != nil {
				name = p.User.Name
				if p.User.OrganizationUnit != nil {
					unit = p.User.OrganizationUnit.Name
				}
			}
			roleLabels := map[string]string{"participant": "Peserta", "moderator": "Moderator", "secretary": "Notulis", "observer": "Observer"}
			roleLabel := roleLabels[p.Role]
			if roleLabel == "" {
				roleLabel = p.Role
			}
			pdf.CellFormat(10, 7, fmt.Sprintf("%d", i+1), "1", 0, "C", fill, 0, "")
			pdf.CellFormat(80, 7, name, "1", 0, "L", fill, 0, "")
			pdf.CellFormat(50, 7, unit, "1", 0, "L", fill, 0, "")
			pdf.CellFormat(30, 7, roleLabel, "1", 1, "C", fill, 0, "")
		}
	}

	// Signature
	pdf.Ln(12)
	if meeting.Organizer != nil {
		pdf.SetFont("Arial", "", 10)
		pdf.CellFormat(120, 6, "", "", 0, "L", false, 0, "")
		pdf.CellFormat(50, 6, "Hormat kami,", "", 1, "C", false, 0, "")
		pdf.CellFormat(120, 6, "", "", 0, "L", false, 0, "")
		pdf.CellFormat(50, 24, "", "", 1, "C", false, 0, "")
		pdf.SetFont("Arial", "BU", 10)
		pdf.CellFormat(120, 6, "", "", 0, "L", false, 0, "")
		pdf.CellFormat(50, 6, meeting.Organizer.Name, "", 1, "C", false, 0, "")
	}

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=undangan-rapat-%d.pdf", id))
	pdf.Output(c.Writer)
}

func (h *MeetingHandler) GenerateAttendance(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	meeting, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meeting not found"})
		return
	}
	participants, _ := h.repo.GetParticipants(id)

	pdf := newPDF("DAFTAR HADIR RAPAT")

	pdf.SetFont("Arial", "", 10)
	pdf.SetXY(20, 38)
	addInfoRow(pdf, "Nomor Rapat", strVal(meeting.MeetingNumber))
	addInfoRow(pdf, "Judul Rapat", meeting.Title)
	addInfoRow(pdf, "Tanggal", formatMeetingDate(meeting.MeetingDate))
	addInfoRow(pdf, "Waktu", fmt.Sprintf("%s - %s WIB", formatTime5(meeting.StartTime), formatTime5(meeting.EndTime)))
	if meeting.Room != nil {
		addInfoRow(pdf, "Tempat", meeting.Room.Name)
	}

	pdf.Ln(6)
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(170, 8, "Daftar Hadir Peserta", "", 1, "L", false, 0, "")

	// Table header
	pdf.SetFillColor(30, 64, 175)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(10, 8, "No", "1", 0, "C", true, 0, "")
	pdf.CellFormat(55, 8, "Nama", "1", 0, "C", true, 0, "")
	pdf.CellFormat(30, 8, "NIP", "1", 0, "C", true, 0, "")
	pdf.CellFormat(40, 8, "Unit/Jabatan", "1", 0, "C", true, 0, "")
	pdf.CellFormat(25, 8, "Status", "1", 0, "C", true, 0, "")
	pdf.CellFormat(10, 8, "TTD", "1", 1, "C", true, 0, "")

	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 8)
	statusLabels := map[string]string{"invited": "Diundang", "confirmed": "Dikonfirmasi", "attended": "Hadir", "absent": "Tidak Hadir", "excused": "Izin"}
	for i, p := range participants {
		fill := i%2 == 0
		if fill {
			pdf.SetFillColor(240, 245, 255)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}
		name, nip, unit := "-", "-", "-"
		if p.User != nil {
			name = p.User.Name
			nip = p.User.Nip
			if p.User.OrganizationUnit != nil {
				unit = p.User.OrganizationUnit.Name
			}
		}
		statusLabel := statusLabels[p.AttendanceStatus]
		if statusLabel == "" {
			statusLabel = p.AttendanceStatus
		}
		pdf.CellFormat(10, 8, fmt.Sprintf("%d", i+1), "1", 0, "C", fill, 0, "")
		pdf.CellFormat(55, 8, name, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(30, 8, nip, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(40, 8, unit, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(25, 8, statusLabel, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(10, 8, "", "1", 1, "C", fill, 0, "")
	}

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=daftar-hadir-%d.pdf", id))
	pdf.Output(c.Writer)
}

func (h *MeetingHandler) GenerateMemo(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	meeting, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meeting not found"})
		return
	}
	participants, _ := h.repo.GetParticipants(id)

	pdf := newPDF("NOTULENSI / MEMO RAPAT")

	pdf.SetFont("Arial", "", 10)
	pdf.SetXY(20, 38)
	addInfoRow(pdf, "Nomor Rapat", strVal(meeting.MeetingNumber))
	addInfoRow(pdf, "Judul Rapat", meeting.Title)
	addInfoRow(pdf, "Tanggal", formatMeetingDate(meeting.MeetingDate))
	addInfoRow(pdf, "Waktu", fmt.Sprintf("%s - %s WIB", formatTime5(meeting.StartTime), formatTime5(meeting.EndTime)))
	if meeting.Room != nil {
		addInfoRow(pdf, "Tempat", meeting.Room.Name)
	}
	if meeting.Organizer != nil {
		addInfoRow(pdf, "Penyelenggara", meeting.Organizer.Name)
	}

	// Attendees summary
	attended := 0
	for _, p := range participants {
		if p.AttendanceStatus == "attended" {
			attended++
		}
	}
	addInfoRow(pdf, "Peserta Hadir", fmt.Sprintf("%d dari %d orang", attended, len(participants)))

	// Memo content
	pdf.Ln(6)
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(170, 8, "Isi Notulensi", "", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)

	memoText := strVal(meeting.MemoContent)
	if memoText == "-" || memoText == "" {
		memoText = "(Belum ada konten notulensi)"
	}
	pdf.MultiCell(170, 6, memoText, "1", "L", false)

	// Action Items
	actionItems, _ := h.repo.GetActionItems(id)
	if len(actionItems) > 0 {
		pdf.Ln(6)
		pdf.SetFont("Arial", "B", 11)
		pdf.CellFormat(170, 8, "Tindak Lanjut (Action Items)", "", 1, "L", false, 0, "")

		pdf.SetFillColor(30, 64, 175)
		pdf.SetTextColor(255, 255, 255)
		pdf.SetFont("Arial", "B", 9)
		pdf.CellFormat(10, 7, "No", "1", 0, "C", true, 0, "")
		pdf.CellFormat(70, 7, "Tindakan", "1", 0, "C", true, 0, "")
		pdf.CellFormat(40, 7, "PIC", "1", 0, "C", true, 0, "")
		pdf.CellFormat(30, 7, "Deadline", "1", 0, "C", true, 0, "")
		pdf.CellFormat(20, 7, "Status", "1", 1, "C", true, 0, "")

		pdf.SetTextColor(0, 0, 0)
		pdf.SetFont("Arial", "", 8)
		for i, item := range actionItems {
			fill := i%2 == 0
			if fill {
				pdf.SetFillColor(240, 245, 255)
			} else {
				pdf.SetFillColor(255, 255, 255)
			}
			deadline := "-"
			if item.Deadline != nil {
				deadline = *item.Deadline
			}
			pdf.CellFormat(10, 7, fmt.Sprintf("%d", i+1), "1", 0, "C", fill, 0, "")
			pdf.CellFormat(70, 7, item.Title, "1", 0, "L", fill, 0, "")
			pic := "-"
			if item.AssignedTo != nil {
				pic = fmt.Sprintf("%d", *item.AssignedTo)
			}
			pdf.CellFormat(40, 7, pic, "1", 0, "C", fill, 0, "")
			pdf.CellFormat(30, 7, deadline, "1", 0, "C", fill, 0, "")
			pdf.CellFormat(20, 7, item.Status, "1", 1, "C", fill, 0, "")
		}
	}

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=notulensi-%d.pdf", id))
	pdf.Output(c.Writer)
}
