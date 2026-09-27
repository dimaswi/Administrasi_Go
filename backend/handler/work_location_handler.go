package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type WorkLocationHandler struct {
	repo *repository.WorkLocationRepository
}

func NewWorkLocationHandler(repo *repository.WorkLocationRepository) *WorkLocationHandler {
	return &WorkLocationHandler{repo: repo}
}

func (h *WorkLocationHandler) GetAll(c *gin.Context) {
	locations, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch work locations: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": locations})
}

func (h *WorkLocationHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	loc, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Work location not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": loc})
}

func (h *WorkLocationHandler) Create(c *gin.Context) {
	var loc models.WorkLocation
	if err := c.ShouldBindJSON(&loc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if loc.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama lokasi wajib diisi"})
		return
	}
	if loc.Radius <= 0 {
		loc.Radius = 100
	}

	if err := h.repo.Create(&loc); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create work location: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Lokasi presensi berhasil ditambahkan", "data": loc})
}

func (h *WorkLocationHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var loc models.WorkLocation
	if err := c.ShouldBindJSON(&loc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	loc.ID = id
	if loc.Radius <= 0 {
		loc.Radius = 100
	}

	if err := h.repo.Update(&loc); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update work location: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Lokasi presensi berhasil diupdate", "data": loc})
}

func (h *WorkLocationHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.repo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete work location: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Lokasi presensi berhasil dihapus"})
}
