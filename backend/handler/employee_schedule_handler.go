package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type EmployeeScheduleHandler struct {
	repo *repository.EmployeeScheduleRepository
}

func NewEmployeeScheduleHandler(repo *repository.EmployeeScheduleRepository) *EmployeeScheduleHandler {
	return &EmployeeScheduleHandler{repo: repo}
}

func (h *EmployeeScheduleHandler) GetAll(c *gin.Context) {
	userIDStr := c.Query("user_id")
	var schedules []models.EmployeeSchedule
	var err error

	if userIDStr != "" {
		userID, _ := strconv.Atoi(userIDStr)
		schedules, err = h.repo.GetByUserID(userID)
	} else {
		schedules, err = h.repo.GetAll()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch schedules"})
		return
	}
	c.JSON(http.StatusOK, schedules)
}

func (h *EmployeeScheduleHandler) Create(c *gin.Context) {
	var schedule models.EmployeeSchedule
	if err := c.ShouldBindJSON(&schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	schedule.CreatedAt = time.Now()
	schedule.UpdatedAt = time.Now()

	if err := h.repo.Create(&schedule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create schedule"})
		return
	}

	c.JSON(http.StatusCreated, schedule)
}
