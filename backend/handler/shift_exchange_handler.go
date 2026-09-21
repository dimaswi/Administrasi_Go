package handler

import (
	"backend/models"
	"backend/repository"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ShiftExchangeHandler struct {
	repo       repository.ShiftExchangeRepository
	rosterRepo *repository.RosterScheduleRepository
}

func NewShiftExchangeHandler(repo repository.ShiftExchangeRepository, rosterRepo *repository.RosterScheduleRepository) *ShiftExchangeHandler {
	return &ShiftExchangeHandler{repo: repo, rosterRepo: rosterRepo}
}

func (h *ShiftExchangeHandler) Create(c *gin.Context) {
	var exchange models.ShiftExchange
	if err := c.ShouldBindJSON(&exchange); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.repo.Create(&exchange)
	if err != nil {
		log.Println("Error creating shift exchange:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create shift exchange"})
		return
	}

	c.JSON(http.StatusCreated, exchange)
}

func (h *ShiftExchangeHandler) GetAll(c *gin.Context) {
	exchanges, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch shift exchanges"})
		return
	}

	// For a complete implementation, we should populate User and Roster data here, 
	// but for now we just return the raw structs. The frontend can map them if needed.
	c.JSON(http.StatusOK, exchanges)
}

func (h *ShiftExchangeHandler) UpdateStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req struct {
		Status     string `json:"status"`
		ApprovedBy *int   `json:"approved_by"` // normally from auth context
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Get the exchange
	exchange, err := h.repo.GetByID(id)
	if err != nil || exchange == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Shift exchange not found"})
		return
	}

	if exchange.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Shift exchange is already " + exchange.Status})
		return
	}

	// 2. Update the status
	err = h.repo.UpdateStatus(id, req.Status, req.ApprovedBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	// 3. If approved, apply the roster swap/transfer
	if req.Status == "approved" {
		// Fetch Original Roster
		originalRoster, err := h.rosterRepo.GetByID(exchange.OriginalRosterID)
		if err == nil && originalRoster != nil {
			// Change Original Roster owner to Target Employee
			if exchange.TargetEmployeeID != nil {
				h.rosterRepo.UpdateEmployeeID(originalRoster.ID, *exchange.TargetEmployeeID)
			}
		}

		// If TargetRosterID is present (Swap)
		if exchange.TargetRosterID != nil {
			targetRoster, err := h.rosterRepo.GetByID(*exchange.TargetRosterID)
			if err == nil && targetRoster != nil {
				// Change Target Roster owner to Requesting Employee
				if exchange.RequestingEmployeeID != nil {
					h.rosterRepo.UpdateEmployeeID(targetRoster.ID, *exchange.RequestingEmployeeID)
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}
