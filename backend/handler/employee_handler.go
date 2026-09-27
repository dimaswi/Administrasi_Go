package handler

import (
	"backend/models"
	"backend/repository"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type EmployeeHandler struct {
	repo     *repository.EmployeeRepository
	userRepo *repository.UserRepository
}

func NewEmployeeHandler(repo *repository.EmployeeRepository, userRepo *repository.UserRepository) *EmployeeHandler {
	return &EmployeeHandler{
		repo:     repo,
		userRepo: userRepo,
	}
}

func (h *EmployeeHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("perPage", "10"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}

	result, err := h.repo.GetAll(page, perPage, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch employees"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *EmployeeHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	emp, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
		return
	}
	c.JSON(http.StatusOK, emp)
}

func (h *EmployeeHandler) GetByUserID(c *gin.Context) {
	userIdStr := c.Param("userId")
	userId, err := strconv.Atoi(userIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid User ID"})
		return
	}

	emp, err := h.repo.GetByUserID(userId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found for this user"})
		return
	}
	c.JSON(http.StatusOK, emp)
}

func (h *EmployeeHandler) Create(c *gin.Context) {
	var emp models.Employee
	if err := c.ShouldBindJSON(&emp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Clean up empty dates to nil to prevent postgres error
	if emp.DateOfBirth != nil && *emp.DateOfBirth == "" { emp.DateOfBirth = nil }
	if emp.ContractStartDate != nil && *emp.ContractStartDate == "" { emp.ContractStartDate = nil }
	if emp.ContractEndDate != nil && *emp.ContractEndDate == "" { emp.ContractEndDate = nil }
	if emp.PermanentDate != nil && *emp.PermanentDate == "" { emp.PermanentDate = nil }
	if emp.ResignDate != nil && *emp.ResignDate == "" { emp.ResignDate = nil }

	emp.CreatedAt = time.Now()
	emp.UpdatedAt = time.Now()

	if err := h.repo.Create(&emp); err != nil {
		log.Printf("Error creating employee: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create employee: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, emp)
}

func (h *EmployeeHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var emp models.Employee
	if err := c.ShouldBindJSON(&emp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	emp.ID = id

	// Clean up empty dates to nil to prevent postgres error
	if emp.DateOfBirth != nil && *emp.DateOfBirth == "" { emp.DateOfBirth = nil }
	if emp.ContractStartDate != nil && *emp.ContractStartDate == "" { emp.ContractStartDate = nil }
	if emp.ContractEndDate != nil && *emp.ContractEndDate == "" { emp.ContractEndDate = nil }
	if emp.PermanentDate != nil && *emp.PermanentDate == "" { emp.PermanentDate = nil }
	if emp.ResignDate != nil && *emp.ResignDate == "" { emp.ResignDate = nil }

	emp.UpdatedAt = time.Now()

	if err := h.repo.Update(&emp); err != nil {
		log.Printf("Error updating employee: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update employee: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, emp)
}

type ManageAccountRequest struct {
	Password *string `json:"password"`
	RoleID   *int    `json:"role_id"`
	UserID   *int    `json:"user_id"` // Add for linking existing user
	Action   string  `json:"action"`  // "unlink" for removing user_id link
}

func (h *EmployeeHandler) ManageAccount(c *gin.Context) {
	idStr := c.Param("id")
	employeeID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	var req ManageAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	emp, err := h.repo.GetByID(employeeID)
	if err != nil || emp == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
		return
	}

	if req.Action == "unlink" {
		if err := h.repo.RemoveUserID(employeeID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlink user account"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "User account unlinked successfully"})
		return
	}

	// If linking existing user
	if req.UserID != nil {
		if err := h.repo.UpdateUserID(employeeID, *req.UserID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link user to employee"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "User account linked successfully"})
		return
	}

	// Otherwise, password and role_id are required
	if req.Password == nil || req.RoleID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password and Role ID are required"})
		return
	}

	// hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	if emp.UserID == nil {
		// Create new user
		lastName := ""
		if emp.LastName != nil {
			lastName = *emp.LastName
		}

		newUser := &models.User{
			Name:      emp.FirstName + " " + lastName,
			Nip:       emp.EmployeeID, // use employee_id as login NIP
			Password:  string(hashedPassword),
			RoleID:    req.RoleID,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := h.userRepo.Create(newUser); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user account"})
			return
		}

		// Link user to employee
		if err := h.repo.UpdateUserID(employeeID, newUser.ID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link user to employee"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message": "User account created and linked successfully"})
	} else {
		// Update existing user password and role
		user, err := h.userRepo.GetByID(*emp.UserID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Linked user not found"})
			return
		}

		user.Password = string(hashedPassword)
		user.RoleID = req.RoleID
		user.UpdatedAt = time.Now()

		if err := h.userRepo.Update(user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password and role"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Password and Role updated successfully"})
	}
}

func (h *EmployeeHandler) RegisterFace(c *gin.Context) {
	idStr := c.Param("id")
	employeeID, _ := strconv.Atoi(idStr)

	var emp *models.Employee

	// 1. Prioritize JWT context user_id
	if userIDVal, exists := c.Get("user_id"); exists {
		var tokenUserID int
		if v, ok := userIDVal.(float64); ok {
			tokenUserID = int(v)
		} else if v, ok := userIDVal.(int); ok {
			tokenUserID = v
		}
		if tokenUserID > 0 && h.repo != nil {
			emp, _ = h.repo.GetByUserID(tokenUserID)
		}
	}

	// 2. Fallback to URL employeeID
	if emp == nil && h.repo != nil && employeeID > 0 {
		emp, _ = h.repo.GetByUserID(employeeID)
		if emp == nil {
			emp, _ = h.repo.GetByID(employeeID)
		}
	}

	if emp == nil || emp.ID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data pegawai tidak ditemukan untuk akun ini"})
		return
	}

	realEmpID := emp.ID

	var payload struct {
		Photo string `json:"photo"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil || payload.Photo == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Foto wajah (photo) wajib diisi"})
		return
	}

	uploadDir := filepath.Join("uploads", "faces")
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.MkdirAll(uploadDir, 0755)
	}

	var rawData []byte
	var err error
	if strings.HasPrefix(payload.Photo, "data:image") {
		idx := strings.Index(payload.Photo, ",")
		if idx != -1 {
			rawData, err = base64.StdEncoding.DecodeString(payload.Photo[idx+1:])
		}
	} else if strings.HasPrefix(payload.Photo, "file://") || strings.HasPrefix(payload.Photo, "http") {
		if err := h.repo.UpdateFacePhoto(realEmpID, payload.Photo); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register face: " + err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Pendaftaran wajah berhasil", "photo": payload.Photo})
		return
	} else {
		rawData, err = base64.StdEncoding.DecodeString(payload.Photo)
	}

	if err != nil || len(rawData) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal memproses gambar foto wajah"})
		return
	}

	filename := fmt.Sprintf("face_%d_%d.jpg", realEmpID, time.Now().Unix())
	filePath := filepath.Join(uploadDir, filename)

	if err := os.WriteFile(filePath, rawData, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan file foto wajah"})
		return
	}

	photoURL := "/uploads/faces/" + filename
	if err := h.repo.UpdateFacePhoto(realEmpID, photoURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update database foto wajah"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pendaftaran wajah berhasil!",
		"photo":   photoURL,
	})
}

