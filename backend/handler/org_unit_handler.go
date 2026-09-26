package handler

import (
	"backend/models"
	"backend/repository"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type OrgUnitHandler struct {
	repo *repository.OrgUnitRepository
}

func NewOrgUnitHandler(repo *repository.OrgUnitRepository) *OrgUnitHandler {
	return &OrgUnitHandler{repo: repo}
}

func (h *OrgUnitHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("perPage", "10"))
	search := c.Query("search")
	level := c.Query("level")

	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}

	result, err := h.repo.GetAll(page, perPage, search, level)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organization units"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *OrgUnitHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	unit, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization unit not found"})
		return
	}
	c.JSON(http.StatusOK, unit)
}

func (h *OrgUnitHandler) Create(c *gin.Context) {
	var unit models.OrganizationUnit
	if err := c.ShouldBindJSON(&unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	unit.CreatedAt = time.Now()
	unit.UpdatedAt = time.Now()

	if err := h.repo.Create(&unit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create organization unit"})
		return
	}

	c.JSON(http.StatusCreated, unit)
}

func (h *OrgUnitHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var unit models.OrganizationUnit
	if err := c.ShouldBindJSON(&unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	unit.ID = id
	unit.UpdatedAt = time.Now()

	if err := h.repo.Update(&unit); err != nil {
		log.Printf("Error updating org unit: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update organization unit: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, unit)
}

func (h *OrgUnitHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.repo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete organization unit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Organization unit deleted successfully"})
}
