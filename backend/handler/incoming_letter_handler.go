package handler

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"backend/models"
	"backend/repository"
	"github.com/gin-gonic/gin"
)

type IncomingLetterHandler struct {
	repo *repository.IncomingLetterRepository
}

func NewIncomingLetterHandler(repo *repository.IncomingLetterRepository) *IncomingLetterHandler {
	return &IncomingLetterHandler{repo: repo}
}

func (h *IncomingLetterHandler) Index(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}
	offset := (page - 1) * perPage

	letters, total, err := h.repo.GetPaginated(c.Request.Context(), perPage, offset, search, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	lastPage := (total + perPage - 1) / perPage

	c.JSON(http.StatusOK, gin.H{
		"data":         letters,
		"current_page": page,
		"per_page":     perPage,
		"total":        total,
		"last_page":    lastPage,
	})
}

func (h *IncomingLetterHandler) Create(c *gin.Context) {
	// Parse multipart form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10 MB limit
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form: " + err.Error()})
		return
	}

	orgUnitID, _ := strconv.ParseInt(c.PostForm("organization_unit_id"), 10, 64)
	registeredBy, _ := strconv.ParseInt(c.PostForm("registered_by"), 10, 64) // Usually from context/JWT
	attachmentCount, _ := strconv.Atoi(c.PostForm("attachment_count"))

	originalDate, _ := time.Parse("2006-01-02", c.PostForm("original_date"))
	receivedDate, _ := time.Parse("2006-01-02", c.PostForm("received_date"))

	var attachmentDescription *string
	if desc := c.PostForm("attachment_description"); desc != "" {
		attachmentDescription = &desc
	}
	
	var notes *string
	if n := c.PostForm("notes"); n != "" {
		notes = &n
	}

	letter := &models.IncomingLetter{
		IncomingNumber:        c.PostForm("incoming_number"),
		OriginalNumber:        c.PostForm("original_number"),
		OriginalDate:          originalDate,
		ReceivedDate:          receivedDate,
		Sender:                c.PostForm("sender"),
		Subject:               c.PostForm("subject"),
		Category:              c.PostForm("category"),
		Classification:        c.PostForm("classification"),
		AttachmentCount:       attachmentCount,
		AttachmentDescription: attachmentDescription,
		OrganizationUnitID:    orgUnitID,
		RegisteredBy:          registeredBy,
		Status:                "new", // Default status
		Notes:                 notes,
	}

	// Handle file upload
	file, fileHeader, err := c.Request.FormFile("file")
	if err == nil {
		defer file.Close()
		
		// Create uploads directory if not exists
		uploadDir := "public/uploads/incoming_letters"
		os.MkdirAll(uploadDir, os.ModePerm)

		// Generate filename
		filename := fmt.Sprintf("%d_%s", time.Now().Unix(), fileHeader.Filename)
		filePath := filepath.Join(uploadDir, filename)
		
		out, err := os.Create(filePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save file"})
			return
		}
		defer out.Close()
		
		_, err = io.Copy(out, file)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed saving file"})
			return
		}
		
		// Set logical path
		logicalPath := "/uploads/incoming_letters/" + filename
		letter.FilePath = &logicalPath
	} else if err != http.ErrMissingFile {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error reading file: " + err.Error()})
		return
	}

	if err := h.repo.Create(c.Request.Context(), letter); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": letter, "message": "Incoming letter created successfully"})
}

func (h *IncomingLetterHandler) Show(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	letter, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if letter == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Incoming letter not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": letter})
}
