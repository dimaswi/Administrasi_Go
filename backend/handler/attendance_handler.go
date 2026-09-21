package handler

import (
	"backend/models"
	"backend/repository"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type AttendanceHandler struct {
	repo *repository.AttendanceRepository
}

func NewAttendanceHandler(repo *repository.AttendanceRepository) *AttendanceHandler {
	return &AttendanceHandler{repo: repo}
}

func (h *AttendanceHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("perPage", "10"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}

	response, err := h.repo.GetAll(page, perPage, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attendances"})
		return
	}
	c.JSON(http.StatusOK, response)
}

func (h *AttendanceHandler) CheckIn(c *gin.Context) {
	var payload struct {
		EmployeeID     int     `json:"employee_id"`
		Date           string  `json:"date"`        // YYYY-MM-DD, optional — default today
		WorkScheduleID *int    `json:"work_schedule_id"`
		Status         string  `json:"status"`
		ClockInTime    string  `json:"clock_in_time"` // HH:mm, optional — default now
		Notes          *string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	dateStr := payload.Date
	if dateStr == "" {
		dateStr = now.Format("2006-01-02")
	}
	timeStr := payload.ClockInTime
	if timeStr == "" {
		timeStr = now.Format("15:04:05")
	} else if len(timeStr) == 5 { // HH:mm → HH:mm:ss
		timeStr += ":00"
	}

	status := payload.Status
	if status == "" {
		status = "present"
	}

	// Wajib punya jadwal
	shiftStart, tolerance, autoWSID, ok := h.repo.GetWorkScheduleForEmployee(payload.EmployeeID, dateStr)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pegawai tidak memiliki jadwal pada tanggal tersebut"})
		return
	}

	// Cek sudah check-in belum
	existing, _ := h.repo.GetByEmployeeIDAndDate(payload.EmployeeID, dateStr)
	if existing != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sudah check-in pada tanggal tersebut"})
		return
	}

	attendance := models.Attendance{
		EmployeeID:     payload.EmployeeID,
		Date:           dateStr,
		ClockIn:        &timeStr,
		WorkScheduleID: payload.WorkScheduleID,
		Notes:          payload.Notes,
	}

	// Auto-fill work_schedule_id dan deteksi terlambat
	if attendance.WorkScheduleID == nil {
		attendance.WorkScheduleID = autoWSID
	}
	if status == "present" && shiftStart != "" {
		shiftT, _ := time.Parse("15:04:05", shiftStart)
		checkinT, _ := time.Parse("15:04:05", timeStr)
		diff := checkinT.Sub(shiftT).Minutes()
		if diff > float64(tolerance) {
			status = "late"
			attendance.LateMinutes = int(diff)
		}
	}
	attendance.Status = status


	if err := h.repo.CheckIn(&attendance); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check in: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, attendance)
}

func (h *AttendanceHandler) CheckOut(c *gin.Context) {
	var payload struct {
		EmployeeID   int    `json:"employee_id"`
		Date         string `json:"date"`          // YYYY-MM-DD, optional — default today
		ClockOutTime string `json:"clock_out_time"` // HH:mm:ss, optional — default now
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	dateStr := payload.Date
	if dateStr == "" {
		dateStr = now.Format("2006-01-02")
	}
	timeStr := payload.ClockOutTime
	if timeStr == "" {
		timeStr = now.Format("15:04:05")
	} else if len(timeStr) == 5 {
		timeStr += ":00"
	}

	// Wajib punya jadwal pada tanggal tersebut
	_, _, _, hasSchedule := h.repo.GetWorkScheduleForEmployee(payload.EmployeeID, dateStr)
	if !hasSchedule {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pegawai tidak memiliki jadwal pada tanggal tersebut"})
		return
	}

	// Check if already checked in
	existing, err := h.repo.GetByEmployeeIDAndDate(payload.EmployeeID, dateStr)
	if err != nil || existing == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Belum ada data check-in untuk tanggal tersebut"})
		return
	}
	if existing.ClockOut != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sudah check-out"})
		return
	}

	if err := h.repo.CheckOut(payload.EmployeeID, dateStr, timeStr); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check out: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Check-out berhasil", "clock_out": timeStr})
}

func (h *AttendanceHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var payload struct {
		ClockIn  *string `json:"clock_in"`
		ClockOut *string `json:"clock_out"`
		Status   string  `json:"status"`
		Notes    *string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Normalize HH:mm to HH:mm:ss
	normalizeTime := func(t *string) *string {
		if t == nil || *t == "" {
			return nil
		}
		s := *t
		if len(s) == 5 {
			s = s + ":00"
		}
		return &s
	}
	clockIn := normalizeTime(payload.ClockIn)
	clockOut := normalizeTime(payload.ClockOut)

	if err := h.repo.Update(id, clockIn, clockOut, payload.Status, payload.Notes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal update: %v", err)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Absensi berhasil diupdate"})
}
