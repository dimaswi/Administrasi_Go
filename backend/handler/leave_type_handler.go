package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type LeaveTypeHandler struct {
	repo *repository.LeaveTypeRepository
}

func NewLeaveTypeHandler(repo *repository.LeaveTypeRepository) *LeaveTypeHandler {
	return &LeaveTypeHandler{repo: repo}
}

func (h *LeaveTypeHandler) GetAll(c *gin.Context) {
	result, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leave types"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *LeaveTypeHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	result, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Leave type not found"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *LeaveTypeHandler) Create(c *gin.Context) {
	var leaveType models.LeaveType
	if err := c.ShouldBindJSON(&leaveType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	leaveType.CreatedAt = time.Now()
	leaveType.UpdatedAt = time.Now()

	err := h.repo.Create(&leaveType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create leave type"})
		return
	}
	c.JSON(http.StatusCreated, leaveType)
}

func (h *LeaveTypeHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var leaveType models.LeaveType
	if err := c.ShouldBindJSON(&leaveType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	leaveType.ID = id
	leaveType.UpdatedAt = time.Now()

	err = h.repo.Update(&leaveType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update leave type"})
		return
	}
	c.JSON(http.StatusOK, leaveType)
}

func (h *LeaveTypeHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = h.repo.Delete(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete leave type"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}
