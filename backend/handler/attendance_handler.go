package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
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
	attendances, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attendances"})
		return
	}
	c.JSON(http.StatusOK, attendances)
}

func (h *AttendanceHandler) CheckIn(c *gin.Context) {
	var payload struct {
		UserID         int    `json:"user_id"`
		WorkScheduleID *int   `json:"work_schedule_id"`
		Notes          *string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	dateStr := now.Format("2006-01-02")
	
	// Check if already checked in
	existing, _ := h.repo.GetByUserIDAndDate(payload.UserID, dateStr)
	if existing != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already checked in today"})
		return
	}

	attendance := models.Attendance{
		UserID:         payload.UserID,
		Date:           dateStr,
		ClockIn:        &now,
		WorkScheduleID: payload.WorkScheduleID,
		Status:         "Hadir", // Can be calculated based on shift time
		Notes:          payload.Notes,
	}

	if err := h.repo.CheckIn(&attendance); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check in: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, attendance)
}

func (h *AttendanceHandler) CheckOut(c *gin.Context) {
	var payload struct {
		UserID int `json:"user_id"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	dateStr := now.Format("2006-01-02")

	// Get existing checkin
	existing, err := h.repo.GetByUserIDAndDate(payload.UserID, dateStr)
	if err != nil || existing == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No check-in found for today"})
		return
	}

	if existing.ClockOut != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already checked out today"})
		return
	}

	if err := h.repo.CheckOut(payload.UserID, dateStr, now, existing.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check out"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Checked out successfully"})
}
