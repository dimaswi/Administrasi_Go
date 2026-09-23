package handler

import (
	"backend/models"
	"backend/repository"
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
	"github.com/gin-gonic/gin"
)

type OutgoingLetterHandler struct {
	Repo *repository.OutgoingLetterRepository
}

func NewOutgoingLetterHandler(repo *repository.OutgoingLetterRepository) *OutgoingLetterHandler {
	return &OutgoingLetterHandler{Repo: repo}
}

func (h *OutgoingLetterHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")
	status := c.Query("status")

	letters, paginationMeta, err := h.Repo.GetAll(page, perPage, search, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":            letters,
		"pagination_meta": paginationMeta,
	})
}

func (h *OutgoingLetterHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	letter, err := h.Repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": letter})
}

func (h *OutgoingLetterHandler) Create(c *gin.Context) {
	var req struct {
		TemplateID     int    `json:"template_id" binding:"required"`
		Subject        string `json:"subject" binding:"required"`
		LetterDate     string `json:"letter_date" binding:"required"`
		VariableValues string `json:"variable_values"`
		Signatories    []struct {
			UserID    int    `json:"user_id"`
			SlotID    string `json:"slot_id"`
			SignOrder int    `json:"sign_order"`
		} `json:"signatories"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	var createdBy int
	if id, ok := userID.(float64); ok {
		createdBy = int(id)
	} else if id, ok := userID.(int); ok {
		createdBy = id
	}

	letter := models.OutgoingLetter{
		TemplateID:     req.TemplateID,
		Subject:        req.Subject,
		LetterDate:     req.LetterDate,
		Status:         "draft",
		CreatedBy:      createdBy,
		CurrentVersion: 1,
	}

	if req.VariableValues != "" {
		letter.VariableValues = &req.VariableValues
	}

	var signatories []models.LetterSignatory
	for _, s := range req.Signatories {
		signatories = append(signatories, models.LetterSignatory{
			UserID:    s.UserID,
			SlotID:    s.SlotID,
			SignOrder: s.SignOrder,
		})
	}

	if err := h.Repo.Create(&letter, signatories); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save letter"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": letter})
}

func (h *OutgoingLetterHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req struct {
		Subject        string `json:"subject" binding:"required"`
		LetterDate     string `json:"letter_date" binding:"required"`
		VariableValues string `json:"variable_values"`
		Signatories    []struct {
			UserID    int    `json:"user_id"`
			SlotID    string `json:"slot_id"`
			SignOrder int    `json:"sign_order"`
		} `json:"signatories"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	letter := models.OutgoingLetter{
		Subject:    req.Subject,
		LetterDate: req.LetterDate,
	}

	if req.VariableValues != "" {
		letter.VariableValues = &req.VariableValues
	}

	var signatories []models.LetterSignatory
	for _, s := range req.Signatories {
		signatories = append(signatories, models.LetterSignatory{
			UserID:    s.UserID,
			SlotID:    s.SlotID,
			SignOrder: s.SignOrder,
		})
	}

	if err := h.Repo.Update(id, &letter, signatories); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update letter: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Letter updated successfully"})
}

func (h *OutgoingLetterHandler) Submit(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// Fetch current letter
	letter, err := h.Repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Letter not found"})
		return
	}

	// Update only the status
	letter.Status = "pending"

	// Fetch its current signatories so we don't overwrite them with empty
	// Note: We need a simpler update just for status if we don't want to fetch all signatories.
	// We can reuse h.Repo.Update but passing the existing signatories, or add a specific method.
	// Since h.Repo.Update expects models.OutgoingLetter, let's just pass empty signatories if it allows partial,
	// but let's be safe and use a direct query or ensure the repo has a status update method.
	// Wait, we can just use the existing Update method if it doesn't delete signatories when passing nil/empty.
	// Actually, let's add UpdateStatus in Repo if needed, but since we are in the handler, let's just assume Repo has it, or use standard Update.
	// Let's just call Repo's Update method with the fetched letter.

	// Better yet, in the previous code, there is already an endpoint for dispositions status.
	// Let's look at how we can do a simple DB update here, since h.Repo.Update might overwrite signatories.
	// Since we are in the handler, we shouldn't execute direct SQL, but we might have to if Repo lacks it.

	err = h.Repo.UpdateStatus(id, "pending")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit letter: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Letter submitted for approval successfully"})
}

func (h *OutgoingLetterHandler) SignLetter(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := h.Repo.Sign(id, int(userID.(float64))); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Letter signed successfully"})
}

func (h *OutgoingLetterHandler) RejectLetter(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Reason string `json:"rejection_reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Repo.Reject(id, int(userID.(float64)), req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Letter rejected successfully"})
}

// GeneratePDF generates a PDF from the frontend React view using chromedp
func (h *OutgoingLetterHandler) GeneratePDF(c *gin.Context) {
	id := c.Param("id")

	// Get the token to pass to the headless browser
	authHeader := c.GetHeader("Authorization")
	var token string
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		token = authHeader[7:]
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// The frontend URL that renders the printable letter
	frontendPrintURL := fmt.Sprintf("http://localhost:5173/admin/outgoing-letters/print/%s?token=%s", id, token)

	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	// Timeout to prevent hanging
	ctx, cancelTimeout := context.WithTimeout(ctx, 30*time.Second)
	defer cancelTimeout()

	var pdfBuffer []byte

	err := chromedp.Run(ctx,
		chromedp.EmulateViewport(1200, 1600), // Ensure large enough viewport
		chromedp.Navigate(frontendPrintURL),
		// Wait until the print-ready div is rendered
		chromedp.WaitVisible("#print-ready", chromedp.ByID),
		// Adding a small sleep to ensure all fonts/images are fully loaded
		chromedp.Sleep(1*time.Second),
		chromedp.ActionFunc(func(ctx context.Context) error {
			// Print to PDF
			buf, _, err := page.PrintToPDF().
				WithPrintBackground(true).
				WithPreferCSSPageSize(true).
				Do(ctx)
			if err != nil {
				return err
			}
			pdfBuffer = buf
			return nil
		}),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate PDF: " + err.Error()})
		return
	}

	// Send PDF as download response
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=Surat_%s.pdf", id))
	c.Header("Content-Length", strconv.Itoa(len(pdfBuffer)))
	c.Writer.Write(pdfBuffer)
}

// Verify returns public details of a fully signed letter for QR code verification
func (h *OutgoingLetterHandler) Verify(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid letter ID"})
		return
	}

	letter, err := h.Repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Letter not found"})
		return
	}

	// Only allow verification for fully signed or approved letters
	if letter.Status != "fully_signed" && letter.Status != "approved" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document not available for verification"})
		return
	}

	// Mask or filter sensitive details if necessary
	// Returning the full letter for now, as it's meant to be publicly verifiable anyway
	c.JSON(http.StatusOK, gin.H{"data": letter})
}
