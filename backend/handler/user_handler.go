package handler

import (
	"backend/models"
	"backend/repository"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	repo *repository.UserRepository
}

func NewUserHandler(repo *repository.UserRepository) *UserHandler {
	return &UserHandler{repo: repo}
}

func (h *UserHandler) GetAll(c *gin.Context) {
	users, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// Note: You might want to remove passwords from response before sending
	for i := range users {
		users[i].Password = ""
	}

	// Calculate total, etc (simple pagination simulation)
	c.JSON(http.StatusOK, gin.H{
		"data":         users,
		"current_page": 1,
		"last_page":    1,
		"per_page":     len(users),
		"total":        len(users),
	})
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	user, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	user.Password = "" // Hide password
	c.JSON(http.StatusOK, gin.H{"data": user})
}

type UserPayload struct {
	Name     string `json:"name" binding:"required"`
	Nip      string `json:"nip" binding:"required"`
	Password string `json:"password"`
	RoleID   *int   `json:"role_id"`
}

func (h *UserHandler) Create(c *gin.Context) {
	var req UserPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if strings.TrimSpace(req.Password) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password wajib diisi"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi password"})
		return
	}

	var roleID *int
	if req.RoleID != nil && *req.RoleID > 0 {
		roleID = req.RoleID
	}

	user := models.User{
		Name:      strings.TrimSpace(req.Name),
		Nip:       strings.TrimSpace(req.Nip),
		Password:  string(hashedPassword),
		RoleID:    roleID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.repo.Create(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	user.Password = ""
	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully", "data": user})
}

func (h *UserHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req UserPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var roleID *int
	if req.RoleID != nil && *req.RoleID > 0 {
		roleID = req.RoleID
	}

	user := models.User{
		ID:        id,
		Name:      strings.TrimSpace(req.Name),
		Nip:       strings.TrimSpace(req.Nip),
		RoleID:    roleID,
		UpdatedAt: time.Now(),
	}

	if strings.TrimSpace(req.Password) != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi password"})
			return
		}
		user.Password = string(hashedPassword)
	}

	if err := h.repo.Update(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	user.Password = ""
	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully", "data": user})
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.repo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}
