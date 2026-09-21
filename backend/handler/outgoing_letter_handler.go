package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type OutgoingLetterHandler struct {
	Repo *repository.OutgoingLetterRepository
}

func NewOutgoingLetterHandler(repo *repository.OutgoingLetterRepository) *OutgoingLetterHandler {
	return &OutgoingLetterHandler{Repo: repo}
}

func (h *OutgoingLetterHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")
	status := c.Query("status")

	letters, paginationMeta, err := h.Repo.GetAll(page, perPage, search, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":            letters,
		"pagination_meta": paginationMeta,
	})
}

func (h *OutgoingLetterHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	letter, err := h.Repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": letter})
}

func (h *OutgoingLetterHandler) Create(c *gin.Context) {
	var req struct {
		TemplateID     int    `json:"template_id" binding:"required"`
		Subject        string `json:"subject" binding:"required"`
		LetterDate     string `json:"letter_date" binding:"required"`
		VariableValues string `json:"variable_values"`
		Signatories    []struct {
			UserID    int    `json:"user_id"`
			SlotID    string `json:"slot_id"`
			SignOrder int    `json:"sign_order"`
		} `json:"signatories"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")

	letter := models.OutgoingLetter{
		TemplateID:     req.TemplateID,
		Subject:        req.Subject,
		LetterDate:     req.LetterDate,
		Status:         "pending",
		CreatedBy:      userID.(int),
		CurrentVersion: 1,
	}

	if req.VariableValues != "" {
		letter.VariableValues = &req.VariableValues
	}

	var signatories []models.LetterSignatory
	for _, s := range req.Signatories {
		signatories = append(signatories, models.LetterSignatory{
			UserID:    s.UserID,
			SlotID:    s.SlotID,
			SignOrder: s.SignOrder,
		})
	}

	if err := h.Repo.Create(&letter, signatories); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": letter})
}
