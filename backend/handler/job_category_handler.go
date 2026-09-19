package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type JobCategoryHandler struct {
	repo *repository.JobCategoryRepository
}

func NewJobCategoryHandler(repo *repository.JobCategoryRepository) *JobCategoryHandler {
	return &JobCategoryHandler{repo: repo}
}

func (h *JobCategoryHandler) GetAll(c *gin.Context) {
	result, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch job categories"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *JobCategoryHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	result, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job category not found"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *JobCategoryHandler) Create(c *gin.Context) {
	var category models.JobCategory
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category.CreatedAt = time.Now()
	category.UpdatedAt = time.Now()

	err := h.repo.Create(&category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create job category"})
		return
	}
	c.JSON(http.StatusCreated, category)
}

func (h *JobCategoryHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var category models.JobCategory
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category.ID = id
	category.UpdatedAt = time.Now()

	err = h.repo.Update(&category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update job category"})
		return
	}
	c.JSON(http.StatusOK, category)
}

func (h *JobCategoryHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = h.repo.Delete(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete job category"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}
