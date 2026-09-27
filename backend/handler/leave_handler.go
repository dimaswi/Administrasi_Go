package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type LeaveHandler struct {
	repo *repository.LeaveRepository
}

func NewLeaveHandler(repo *repository.LeaveRepository) *LeaveHandler {
	return &LeaveHandler{repo: repo}
}

func (h *LeaveHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("perPage", "10"))
	search := c.Query("search")
	employeeID, _ := strconv.Atoi(c.Query("employee_id"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}

	result, err := h.repo.GetAll(page, perPage, search, employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaves"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *LeaveHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	leave, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Leave not found"})
		return
	}
	c.JSON(http.StatusOK, leave)
}

type UpdateLeaveStatusRequest struct {
	Status string `json:"status" binding:"required"`
	Notes  string `json:"approval_notes"`
}

func (h *LeaveHandler) UpdateStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req UpdateLeaveStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a real app, you would get the user ID from the JWT token
	// For now we assume user ID 1 or extract from context if auth middleware sets it
	// approvedBy := c.GetInt("user_id") // Assuming your auth middleware sets this
	// We'll just hardcode 1 for demonstration if it's not set
	approvedBy := c.GetInt("user_id")
	if approvedBy == 0 {
		approvedBy = 1 // Fallback
	}

	if err := h.repo.UpdateStatus(id, req.Status, req.Notes, approvedBy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update leave status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Leave status updated successfully"})
}

func (h *LeaveHandler) Create(c *gin.Context) {
	var leave models.Leave
	if err := c.ShouldBindJSON(&leave); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if leave.Status == "" {
		leave.Status = "pending"
	}

	if err := h.repo.Create(&leave); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create leave request: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Pengajuan berhasil dikirim",
		"data":    leave,
	})
}

