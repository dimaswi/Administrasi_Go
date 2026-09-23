package handler

import (
	"net/http"
	"strconv"
	"time"

	"backend/models"
	"backend/repository"
	"github.com/gin-gonic/gin"
)

type DispositionHandler struct {
	repo *repository.DispositionRepository
	letterRepo *repository.IncomingLetterRepository
}

func NewDispositionHandler(repo *repository.DispositionRepository, letterRepo *repository.IncomingLetterRepository) *DispositionHandler {
	return &DispositionHandler{
		repo: repo,
		letterRepo: letterRepo,
	}
}

func (h *DispositionHandler) GetByLetter(c *gin.Context) {
	letterID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid letter ID format"})
		return
	}

	dispositions, err := h.repo.GetByLetterID(c.Request.Context(), letterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": dispositions})
}

func (h *DispositionHandler) Create(c *gin.Context) {
	var input struct {
		IncomingLetterID    int64      `json:"incoming_letter_id" binding:"required"`
		ParentDispositionID *int64     `json:"parent_disposition_id"`
		FromUserID          int64      `json:"from_user_id" binding:"required"`
		ToUserID            int64      `json:"to_user_id" binding:"required"`
		Instruction         string     `json:"instruction" binding:"required"`
		Notes               *string    `json:"notes"`
		Priority            string     `json:"priority" binding:"required"`
		Deadline            *time.Time `json:"deadline"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	disposition := &models.Disposition{
		IncomingLetterID:    input.IncomingLetterID,
		ParentDispositionID: input.ParentDispositionID,
		FromUserID:          input.FromUserID,
		ToUserID:            input.ToUserID,
		Instruction:         input.Instruction,
		Notes:               input.Notes,
		Priority:            input.Priority,
		Deadline:            input.Deadline,
		Status:              "pending",
	}

	if err := h.repo.Create(c.Request.Context(), disposition); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Optionally update the parent incoming letter status to "disposed" or "in_progress"
	letter, err := h.letterRepo.GetByID(c.Request.Context(), disposition.IncomingLetterID)
	if err == nil && letter != nil {
		if letter.Status == "new" {
			letter.Status = "disposed"
			h.letterRepo.Update(c.Request.Context(), letter)
		}
	}

	c.JSON(http.StatusCreated, gin.H{"data": disposition, "message": "Disposition created successfully"})
}

func (h *DispositionHandler) UpdateStatus(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid disposition ID"})
		return
	}

	var input struct {
		Status string `json:"status" binding:"required,oneof=pending read in_progress completed"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.UpdateStatus(c.Request.Context(), id, input.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Disposition status updated successfully"})
}

func (h *DispositionHandler) GetMyDispositions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	status := c.Query("status")
	priority := c.Query("priority")

	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}
	offset := (page - 1) * perPage

	userID := int64(c.GetFloat64("user_id"))

	dispositions, total, err := h.repo.GetMyDispositions(c.Request.Context(), userID, perPage, offset, status, priority)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":         dispositions,
		"current_page": page,
		"per_page":     perPage,
		"total":        total,
	})
}
