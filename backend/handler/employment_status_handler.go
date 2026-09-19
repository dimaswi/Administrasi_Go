package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type EmploymentStatusHandler struct {
	repo *repository.EmploymentStatusRepository
}

func NewEmploymentStatusHandler(repo *repository.EmploymentStatusRepository) *EmploymentStatusHandler {
	return &EmploymentStatusHandler{repo: repo}
}

func (h *EmploymentStatusHandler) GetAll(c *gin.Context) {
	result, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch employment statuses"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *EmploymentStatusHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	result, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employment status not found"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *EmploymentStatusHandler) Create(c *gin.Context) {
	var status models.EmploymentStatus
	if err := c.ShouldBindJSON(&status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status.CreatedAt = time.Now()
	status.UpdatedAt = time.Now()

	err := h.repo.Create(&status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create employment status"})
		return
	}
	c.JSON(http.StatusCreated, status)
}

func (h *EmploymentStatusHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var status models.EmploymentStatus
	if err := c.ShouldBindJSON(&status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status.ID = id
	status.UpdatedAt = time.Now()

	err = h.repo.Update(&status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update employment status"})
		return
	}
	c.JSON(http.StatusOK, status)
}

func (h *EmploymentStatusHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = h.repo.Delete(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete employment status"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}
