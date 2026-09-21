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
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}

	response, err := h.repo.GetAll(page, perPage, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rosters"})
		return
	}
	c.JSON(http.StatusOK, response)
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
		EmployeeID     int    `json:"employee_id"`
		WorkScheduleID int    `json:"work_schedule_id"` // 0 means delete
		Date           string `json:"date"`             // YYYY-MM-DD
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.AssignShift(payload.EmployeeID, payload.Date, payload.WorkScheduleID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign shift"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Shift assigned successfully"})
}

func (h *RosterScheduleHandler) AutoGenerate(c *gin.Context) {
	var payload struct {
		EmployeeID      int    `json:"employee_id"`
		UnitID          int    `json:"unit_id"`
		StartDate       string `json:"start_date"`
		EndDate         string `json:"end_date"`
		WorkDaysPattern string `json:"work_days_pattern"`
		WorkScheduleIDs []int  `json:"work_schedule_ids"`
		Overwrite       bool   `json:"overwrite"`
		CheckOnly       bool   `json:"check_only"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if payload.CheckOnly {
		conflicts, err := h.repo.CheckConflicts(payload.EmployeeID, payload.UnitID, payload.StartDate, payload.EndDate)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check conflicts"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"conflicts": conflicts})
		return
	}

	err := h.repo.AutoGenerate(payload.EmployeeID, payload.UnitID, payload.StartDate, payload.EndDate, payload.WorkDaysPattern, payload.WorkScheduleIDs, payload.Overwrite)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate schedule"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Schedule generated successfully"})
}
