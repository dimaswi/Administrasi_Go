package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type WorkScheduleHandler struct {
	repo *repository.WorkScheduleRepository
}

func NewWorkScheduleHandler(repo *repository.WorkScheduleRepository) *WorkScheduleHandler {
	return &WorkScheduleHandler{repo: repo}
}

func (h *WorkScheduleHandler) GetAll(c *gin.Context) {
	schedules, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch work schedules"})
		return
	}
	c.JSON(http.StatusOK, schedules)
}

func (h *WorkScheduleHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	schedule, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Work schedule not found"})
		return
	}
	c.JSON(http.StatusOK, schedule)
}

func (h *WorkScheduleHandler) Create(c *gin.Context) {
	var schedule models.WorkSchedule
	if err := c.ShouldBindJSON(&schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	schedule.CreatedAt = time.Now()
	schedule.UpdatedAt = time.Now()

	if err := h.repo.Create(&schedule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create work schedule"})
		return
	}

	c.JSON(http.StatusCreated, schedule)
}

func (h *WorkScheduleHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var schedule models.WorkSchedule
	if err := c.ShouldBindJSON(&schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.Update(id, &schedule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update work schedule"})
		return
	}

	c.JSON(http.StatusOK, schedule)
}

func (h *WorkScheduleHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.repo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete work schedule"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Work schedule deleted"})
}
