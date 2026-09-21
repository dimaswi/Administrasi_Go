package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type EmployeeDetailHandler struct {
	repo *repository.EmployeeDetailRepository
}

func NewEmployeeDetailHandler(repo *repository.EmployeeDetailRepository) *EmployeeDetailHandler {
	return &EmployeeDetailHandler{repo: repo}
}

// --- Family ---

func (h *EmployeeDetailHandler) GetFamilies(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Param("id"))
	if employeeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	families, err := h.repo.GetFamilies(employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch families"})
		return
	}
	c.JSON(http.StatusOK, families)
}

func (h *EmployeeDetailHandler) CreateFamily(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Param("id"))
	if employeeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	var fam models.EmployeeFamily
	if err := c.ShouldBindJSON(&fam); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fam.EmployeeID = employeeID

	if err := h.repo.CreateFamily(&fam); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create family record"})
		return
	}
	c.JSON(http.StatusCreated, fam)
}

func (h *EmployeeDetailHandler) UpdateFamily(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Param("id"))
	detailID, _ := strconv.Atoi(c.Param("detailId"))
	if employeeID == 0 || detailID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid IDs"})
		return
	}

	var fam models.EmployeeFamily
	if err := c.ShouldBindJSON(&fam); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fam.ID = detailID
	fam.EmployeeID = employeeID

	if err := h.repo.UpdateFamily(&fam); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update family record"})
		return
	}
	c.JSON(http.StatusOK, fam)
}

func (h *EmployeeDetailHandler) DeleteFamily(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Param("id"))
	detailID, _ := strconv.Atoi(c.Param("detailId"))
	if employeeID == 0 || detailID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid IDs"})
		return
	}

	if err := h.repo.DeleteFamily(detailID, employeeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete family record"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Family record deleted"})
}

// --- Education ---

func (h *EmployeeDetailHandler) GetEducations(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Param("id"))
	if employeeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	educations, err := h.repo.GetEducations(employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch educations"})
		return
	}
	c.JSON(http.StatusOK, educations)
}

func (h *EmployeeDetailHandler) CreateEducation(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Param("id"))
	if employeeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	var edu models.EmployeeEducation
	if err := c.ShouldBindJSON(&edu); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	edu.EmployeeID = employeeID

	if err := h.repo.CreateEducation(&edu); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create education record"})
		return
	}
	c.JSON(http.StatusCreated, edu)
}

func (h *EmployeeDetailHandler) UpdateEducation(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Param("id"))
	detailID, _ := strconv.Atoi(c.Param("detailId"))
	if employeeID == 0 || detailID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid IDs"})
		return
	}

	var edu models.EmployeeEducation
	if err := c.ShouldBindJSON(&edu); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	edu.ID = detailID
	edu.EmployeeID = employeeID

	if err := h.repo.UpdateEducation(&edu); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update education record"})
		return
	}
	c.JSON(http.StatusOK, edu)
}

func (h *EmployeeDetailHandler) DeleteEducation(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Param("id"))
	detailID, _ := strconv.Atoi(c.Param("detailId"))
	if employeeID == 0 || detailID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid IDs"})
		return
	}

	if err := h.repo.DeleteEducation(detailID, employeeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete education record"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Education record deleted"})
}

// --- Work History ---

func (h *EmployeeDetailHandler) GetWorkHistories(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Param("id"))
	if employeeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	histories, err := h.repo.GetWorkHistories(employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch work histories"})
		return
	}
	c.JSON(http.StatusOK, histories)
}

func (h *EmployeeDetailHandler) CreateWorkHistory(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Param("id"))
	if employeeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	var hist models.EmployeeWorkHistory
	if err := c.ShouldBindJSON(&hist); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	hist.EmployeeID = employeeID

	if err := h.repo.CreateWorkHistory(&hist); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create work history record"})
		return
	}
	c.JSON(http.StatusCreated, hist)
}

func (h *EmployeeDetailHandler) UpdateWorkHistory(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Param("id"))
	detailID, _ := strconv.Atoi(c.Param("detailId"))
	if employeeID == 0 || detailID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid IDs"})
		return
	}

	var hist models.EmployeeWorkHistory
	if err := c.ShouldBindJSON(&hist); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	hist.ID = detailID
	hist.EmployeeID = employeeID

	if err := h.repo.UpdateWorkHistory(&hist); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update work history record"})
		return
	}
	c.JSON(http.StatusOK, hist)
}

func (h *EmployeeDetailHandler) DeleteWorkHistory(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Param("id"))
	detailID, _ := strconv.Atoi(c.Param("detailId"))
	if employeeID == 0 || detailID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid IDs"})
		return
	}

	if err := h.repo.DeleteWorkHistory(detailID, employeeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete work history record"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Work history record deleted"})
}
