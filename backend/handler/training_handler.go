package handler

import (
	"net/http"
	"strconv"

	"backend/models"
	"backend/repository"
	"github.com/gin-gonic/gin"
)

type TrainingHandler struct {
	repo *repository.TrainingRepository
}

func NewTrainingHandler(repo *repository.TrainingRepository) *TrainingHandler {
	return &TrainingHandler{repo: repo}
}

// ==================== Training Program ====================

func (h *TrainingHandler) GetAllTrainings(c *gin.Context) {
	search := c.Query("search")
	typeFilter := c.Query("type")
	category := c.Query("category")
	status := c.Query("status")

	data, err := h.repo.GetAllTrainings(search, typeFilter, category, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *TrainingHandler) GetTrainingByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	t, err := h.repo.GetTrainingByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Training not found"})
		return
	}
	c.JSON(http.StatusOK, t)
}

func (h *TrainingHandler) CreateTraining(c *gin.Context) {
	var t models.Training
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.repo.CreateTraining(&t); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, t)
}

func (h *TrainingHandler) UpdateTraining(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	var t models.Training
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.repo.UpdateTraining(id, &t); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Training updated successfully"})
}

func (h *TrainingHandler) DeleteTraining(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	if err := h.repo.DeleteTraining(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Training deleted successfully"})
}

// ==================== Employee Training (Peserta) ====================

func (h *TrainingHandler) GetAllEmployeeTrainings(c *gin.Context) {
	search := c.Query("search")
	trainingID, _ := strconv.Atoi(c.Query("training_id"))
	status := c.Query("status")

	data, err := h.repo.GetAllEmployeeTrainings(search, trainingID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *TrainingHandler) GetEmployeeTrainingByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	et, err := h.repo.GetEmployeeTrainingByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data not found"})
		return
	}
	c.JSON(http.StatusOK, et)
}

func (h *TrainingHandler) CreateEmployeeTraining(c *gin.Context) {
	var et models.EmployeeTraining
	if err := c.ShouldBindJSON(&et); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.repo.CreateEmployeeTraining(&et); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, et)
}

func (h *TrainingHandler) UpdateEmployeeTraining(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	var et models.EmployeeTraining
	if err := c.ShouldBindJSON(&et); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.repo.UpdateEmployeeTraining(id, &et); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Employee training updated successfully"})
}

func (h *TrainingHandler) DeleteEmployeeTraining(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	if err := h.repo.DeleteEmployeeTraining(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Employee training deleted successfully"})
}
