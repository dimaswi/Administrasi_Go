package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type EducationLevelHandler struct {
	repo *repository.EducationLevelRepository
}

func NewEducationLevelHandler(repo *repository.EducationLevelRepository) *EducationLevelHandler {
	return &EducationLevelHandler{repo: repo}
}

func (h *EducationLevelHandler) GetAll(c *gin.Context) {
	result, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch education levels"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *EducationLevelHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	result, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Education level not found"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *EducationLevelHandler) Create(c *gin.Context) {
	var level models.EducationLevel
	if err := c.ShouldBindJSON(&level); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	level.CreatedAt = time.Now()
	level.UpdatedAt = time.Now()

	err := h.repo.Create(&level)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create education level"})
		return
	}
	c.JSON(http.StatusCreated, level)
}

func (h *EducationLevelHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var level models.EducationLevel
	if err := c.ShouldBindJSON(&level); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	level.ID = id
	level.UpdatedAt = time.Now()

	err = h.repo.Update(&level)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update education level"})
		return
	}
	c.JSON(http.StatusOK, level)
}

func (h *EducationLevelHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = h.repo.Delete(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete education level"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}
