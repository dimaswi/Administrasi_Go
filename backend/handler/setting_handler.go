package handler

import (
	"backend/repository"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SettingHandler struct {
	repo *repository.SettingRepository
}

func NewSettingHandler(repo *repository.SettingRepository) *SettingHandler {
	return &SettingHandler{repo: repo}
}

func (h *SettingHandler) GetAll(c *gin.Context) {
	settings, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func (h *SettingHandler) Update(c *gin.Context) {
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for k, v := range req {
		if err := h.repo.Upsert(k, v); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update " + k})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Settings updated"})
}

func (h *SettingHandler) UploadLogo(c *gin.Context) {
	h.uploadFile(c, "app_logo")
}

func (h *SettingHandler) UploadIcon(c *gin.Context) {
	h.uploadFile(c, "app_icon")
}

func (h *SettingHandler) uploadFile(c *gin.Context, settingKey string) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file is received"})
		return
	}
	defer file.Close()

	// Create uploads directory if it doesn't exist
	uploadDir := "uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := uuid.New().String() + ext
	filePath := filepath.Join(uploadDir, filename)

	// Save file
	out, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save file"})
		return
	}
	defer out.Close()
	_, err = io.Copy(out, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save file"})
		return
	}

	// URL path to store in DB
	// Note: this assumes we will serve static files from /uploads route
	fileURL := "/uploads/" + filename
	// Remove windows backward slashes if any
	fileURL = strings.ReplaceAll(fileURL, "\\", "/")

	if err := h.repo.Upsert(settingKey, fileURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "File uploaded successfully",
		"url":     fileURL,
	})
}
