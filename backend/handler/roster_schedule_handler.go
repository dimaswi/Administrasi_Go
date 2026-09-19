package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type RosterScheduleHandler struct {
	repo *repository.RosterScheduleRepository
}

func NewRosterScheduleHandler(repo *repository.RosterScheduleRepository) *RosterScheduleHandler {
	return &RosterScheduleHandler{repo: repo}
}

func (h *RosterScheduleHandler) GetAll(c *gin.Context) {
	schedules, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rosters"})
		return
	}
	c.JSON(http.StatusOK, schedules)
}

func (h *RosterScheduleHandler) Create(c *gin.Context) {
	var schedule models.RosterSchedule
	if err := c.ShouldBindJSON(&schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	schedule.CreatedAt = time.Now()
	schedule.UpdatedAt = time.Now()

	if err := h.repo.Create(&schedule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create roster"})
		return
	}

	c.JSON(http.StatusCreated, schedule)
}

func (h *RosterScheduleHandler) GetByUnitAndMonth(c *gin.Context) {
	unitIDStr := c.Param("unit_id")
	yearMonth := c.Param("year_month")

	unitID, err := strconv.Atoi(unitIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid unit ID"})
		return
	}

	schedules, err := h.repo.GetByUnitAndMonth(unitID, yearMonth)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rosters"})
		return
	}
	c.JSON(http.StatusOK, schedules)
}

func (h *RosterScheduleHandler) AssignShift(c *gin.Context) {
	var payload struct {
		UserID         int    `json:"user_id"`
		WorkScheduleID int    `json:"work_schedule_id"` // 0 means delete
		Date           string `json:"date"`             // YYYY-MM-DD
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.AssignShift(payload.UserID, payload.Date, payload.WorkScheduleID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign shift"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Shift assigned successfully"})
}
