package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type KpiHandler struct {
	repo *repository.KpiRepository
}

func NewKpiHandler(repo *repository.KpiRepository) *KpiHandler {
	return &KpiHandler{repo: repo}
}

// --- KPI Categories ---

func (h *KpiHandler) GetAllCategories(c *gin.Context) {
	result, err := h.repo.GetAllCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch KPI categories"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *KpiHandler) GetCategoryByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	result, err := h.repo.GetCategoryByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "KPI category not found"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *KpiHandler) CreateCategory(c *gin.Context) {
	var category models.KpiCategory
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category.CreatedAt = time.Now()
	category.UpdatedAt = time.Now()

	err := h.repo.CreateCategory(&category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create KPI category: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, category)
}

func (h *KpiHandler) UpdateCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var category models.KpiCategory
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category.ID = id
	category.UpdatedAt = time.Now()

	err = h.repo.UpdateCategory(&category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update KPI category: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, category)
}

func (h *KpiHandler) DeleteCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = h.repo.DeleteCategory(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "KPI category deleted successfully"})
}

// --- KPI Templates ---

func (h *KpiHandler) GetAllTemplates(c *gin.Context) {
	result, err := h.repo.GetAllTemplates()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch KPI templates"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *KpiHandler) GetTemplateByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	result, err := h.repo.GetTemplateByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "KPI template not found"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *KpiHandler) CreateTemplate(c *gin.Context) {
	var template models.KpiTemplate
	if err := c.ShouldBindJSON(&template); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	template.CreatedAt = time.Now()
	template.UpdatedAt = time.Now()

	err := h.repo.CreateTemplate(&template)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create KPI template: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, template)
}

func (h *KpiHandler) UpdateTemplate(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var template models.KpiTemplate
	if err := c.ShouldBindJSON(&template); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	template.ID = id
	template.UpdatedAt = time.Now()

	err = h.repo.UpdateTemplate(&template)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update KPI template: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, template)
}

func (h *KpiHandler) DeleteTemplate(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = h.repo.DeleteTemplate(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete KPI template: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "KPI template deleted successfully"})
}

