package handler

import (
	"backend/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type DocumentTemplateHandler struct {
	Repo *repository.DocumentTemplateRepository
}

func NewDocumentTemplateHandler(repo *repository.DocumentTemplateRepository) *DocumentTemplateHandler {
	return &DocumentTemplateHandler{Repo: repo}
}

func (h *DocumentTemplateHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")

	templates, paginationMeta, err := h.Repo.GetAll(page, perPage, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":            templates,
		"pagination_meta": paginationMeta,
	})
}

func (h *DocumentTemplateHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	template, err := h.Repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": template})
}
