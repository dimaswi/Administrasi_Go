package handler

import (
	"backend/models"
	"backend/repository"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type AttendanceHandler struct {
	repo             *repository.AttendanceRepository
	settingRepo      *repository.SettingRepository
	employeeRepo     *repository.EmployeeRepository
	workLocationRepo *repository.WorkLocationRepository
}

func NewAttendanceHandler(
	repo *repository.AttendanceRepository,
	settingRepo *repository.SettingRepository,
	employeeRepo *repository.EmployeeRepository,
	workLocationRepo *repository.WorkLocationRepository,
) *AttendanceHandler {
	return &AttendanceHandler{
		repo:             repo,
		settingRepo:      settingRepo,
		employeeRepo:     employeeRepo,
		workLocationRepo: workLocationRepo,
	}
}

func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371000 // Earth radius in meters
	phi1 := lat1 * math.Pi / 180
	phi2 := lat2 * math.Pi / 180
	deltaPhi := (lat2 - lat1) * math.Pi / 180
	deltaLambda := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(deltaPhi/2)*math.Sin(deltaPhi/2) +
		math.Cos(phi1)*math.Cos(phi2)*
			math.Sin(deltaLambda/2)*math.Sin(deltaLambda/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}

type GeofenceTarget struct {
	Name      string
	Latitude  float64
	Longitude float64
	Radius    int
}

func (h *AttendanceHandler) getAllGeofenceTargets() []GeofenceTarget {
	var targets []GeofenceTarget

	// 1. Fetch active locations from work_locations master table
	if h.workLocationRepo != nil {
		locs, err := h.workLocationRepo.GetActiveLocations()
		if err == nil {
			for _, loc := range locs {
				targets = append(targets, GeofenceTarget{
					Name:      loc.Name,
					Latitude:  loc.Latitude,
					Longitude: loc.Longitude,
					Radius:    loc.Radius,
				})
			}
		}
	}

	// 2. Fetch office location from app_settings table
	if h.settingRepo != nil {
		settings, err := h.settingRepo.GetAll()
		if err == nil {
			officeLatStr := settings["office_latitude"]
			officeLonStr := settings["office_longitude"]
			officeRadStr := settings["office_radius"]
			officeName := settings["office_name"]
			if officeName == "" {
				officeName = "Kantor Utama"
			}

			if officeLatStr != "" && officeLonStr != "" {
				officeLat, _ := strconv.ParseFloat(officeLatStr, 64)
				officeLon, _ := strconv.ParseFloat(officeLonStr, 64)
				officeRad, _ := strconv.Atoi(officeRadStr)
				if officeRad <= 0 {
					officeRad = 100
				}

				// Check if duplicate lat/lon already exists in targets
				exists := false
				for _, t := range targets {
					if math.Abs(t.Latitude-officeLat) < 0.00001 && math.Abs(t.Longitude-officeLon) < 0.00001 {
						exists = true
						break
					}
				}
				if !exists {
					targets = append(targets, GeofenceTarget{
						Name:      officeName,
						Latitude:  officeLat,
						Longitude: officeLon,
						Radius:    officeRad,
					})
				}
			}
		}
	}

	return targets
}

func (h *AttendanceHandler) validateGeofence(userLat, userLon float64) error {
	targets := h.getAllGeofenceTargets()
	if len(targets) == 0 {
		return nil
	}

	insideAny := false
	var closestTarget GeofenceTarget
	closestDist := math.MaxFloat64

	for _, target := range targets {
		dist := haversineDistance(userLat, userLon, target.Latitude, target.Longitude)
		if dist < closestDist {
			closestDist = dist
			closestTarget = target
		}
		rad := float64(target.Radius)
		if rad <= 0 {
			rad = 100
		}
		if dist <= rad {
			insideAny = true
			break
		}
	}

	if !insideAny {
		return fmt.Errorf("Anda berada di luar semua lokasi presensi resmi kantor! Jarak terdekat: %.0fm dari %s (Maksimal radius: %dm)", closestDist, closestTarget.Name, closestTarget.Radius)
	}

	return nil
}

func loadImageData(src string) (image.Image, error) {
	var data []byte
	var err error

	if strings.HasPrefix(src, "data:image") {
		idx := strings.Index(src, ",")
		if idx != -1 {
			data, err = base64.StdEncoding.DecodeString(src[idx+1:])
		} else {
			return nil, fmt.Errorf("invalid base64 format")
		}
	} else if strings.HasPrefix(src, "/uploads") {
		relPath := strings.TrimPrefix(src, "/")
		data, err = os.ReadFile(relPath)
	} else if strings.HasPrefix(src, "uploads") {
		data, err = os.ReadFile(src)
	} else if strings.HasPrefix(src, "http://") || strings.HasPrefix(src, "https://") {
		resp, hErr := http.Get(src)
		if hErr != nil {
			return nil, hErr
		}
		defer resp.Body.Close()
		img, _, decodeErr := image.Decode(resp.Body)
		return img, decodeErr
	} else {
		data, err = os.ReadFile(src)
	}

	if err != nil {
		return nil, err
	}

	img, _, err := image.Decode(bytes.NewReader(data))
	return img, err
}

func saveAndRegisterFacePhoto(h *AttendanceHandler, realEmpID int, photoStr string) (string, error) {
	if photoStr == "" {
		return "", fmt.Errorf("Foto selfie kosong")
	}

	uploadDir := filepath.Join("uploads", "faces")
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.MkdirAll(uploadDir, 0755)
	}

	var rawData []byte
	var err error
	if strings.HasPrefix(photoStr, "data:image") {
		idx := strings.Index(photoStr, ",")
		if idx != -1 {
			rawData, err = base64.StdEncoding.DecodeString(photoStr[idx+1:])
		}
	} else if strings.HasPrefix(photoStr, "file://") || strings.HasPrefix(photoStr, "http") {
		if h.employeeRepo != nil {
			_ = h.employeeRepo.UpdateFacePhoto(realEmpID, photoStr)
		}
		return photoStr, nil
	} else {
		rawData, err = base64.StdEncoding.DecodeString(photoStr)
	}

	if err != nil || len(rawData) == 0 {
		return "", fmt.Errorf("Gagal memproses gambar foto selfie")
	}

	filename := fmt.Sprintf("face_%d_%d.jpg", realEmpID, time.Now().Unix())
	filePath := filepath.Join(uploadDir, filename)

	if err := os.WriteFile(filePath, rawData, 0644); err != nil {
		return "", fmt.Errorf("Gagal menyimpan file foto wajah")
	}

	photoURL := "/uploads/faces/" + filename
	if h.employeeRepo != nil {
		_ = h.employeeRepo.UpdateFacePhoto(realEmpID, photoURL)
	}
	return photoURL, nil
}

func compareFacePhotos(regPath, livePhoto string) (float64, bool, error) {
	if livePhoto == "" {
		return 0, false, fmt.Errorf("Foto live selfie kosong")
	}

	// 1. Try Python Face Recognition Microservice
	pyPayload := map[string]string{
		"registered_photo": regPath,
		"live_photo":       livePhoto,
	}
	jsonBytes, err := json.Marshal(pyPayload)
	if err == nil {
		faceServiceURL := os.Getenv("FACE_SERVICE_URL")
		if faceServiceURL == "" {
			faceServiceURL = "http://localhost:5000/api/verify-face"
		}
		client := &http.Client{Timeout: 6 * time.Second}
		resp, err := client.Post(faceServiceURL, "application/json", bytes.NewBuffer(jsonBytes))
		if err == nil && resp.StatusCode == http.StatusOK {
			var pyRes struct {
				Success    bool    `json:"success"`
				Match      bool    `json:"match"`
				Similarity float64 `json:"similarity"`
				Error      string  `json:"error"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&pyRes); err == nil && pyRes.Success {
				resp.Body.Close()
				return pyRes.Similarity, pyRes.Match, nil
			}
			resp.Body.Close()
		}
	}

	// 2. Fallback: Internal Go Face Comparison Engine
	regImg, err := loadImageData(regPath)
	if err != nil {
		return 0, false, fmt.Errorf("Foto pendaftaran wajah pegawai (%s) tidak ditemukan atau gagal dibaca di server", regPath)
	}

	liveImg, err := loadImageData(livePhoto)
	if err != nil {
		return 0, false, fmt.Errorf("Gagal membaca foto live selfie: %v", err)
	}

	const size = 32
	getLumaMatrix := func(img image.Image) ([]float64, float64) {
		bounds := img.Bounds()
		mat := make([]float64, size*size)
		w := bounds.Dx()
		h := bounds.Dy()
		if w == 0 || h == 0 {
			return mat, 0
		}

		var sum float64
		for y := 0; y < size; y++ {
			for x := 0; x < size; x++ {
				srcX := bounds.Min.X + (x * w / size)
				srcY := bounds.Min.Y + (y * h / size)
				r, g, b, _ := img.At(srcX, srcY).RGBA()
				luma := (0.299*float64(r) + 0.587*float64(g) + 0.114*float64(b)) / 65535.0
				mat[y*size+x] = luma
				sum += luma
			}
		}

		mean := sum / float64(size*size)
		var varianceSum float64
		for i := 0; i < size*size; i++ {
			diff := mat[i] - mean
			varianceSum += diff * diff
		}
		stdDev := math.Sqrt(varianceSum / float64(size*size))

		return mat, stdDev
	}

	m1, _ := getLumaMatrix(regImg)
	m2, std2 := getLumaMatrix(liveImg)

	// 1. Check if live photo is blank / plain wall / featureless
	if std2 < 0.028 {
		return 0, false, fmt.Errorf("Wajah tidak terdeteksi! Foto yang diambil polos/kosong atau terlalu gelap.")
	}

	// 2. Normalized Cross Correlation (NCC) and Structural Region Comparison
	var mean1, mean2 float64
	for i := 0; i < size*size; i++ {
		mean1 += m1[i]
		mean2 += m2[i]
	}
	mean1 /= float64(size * size)
	mean2 /= float64(size * size)

	var num, den1, den2 float64
	for i := 0; i < size*size; i++ {
		diff1 := m1[i] - mean1
		diff2 := m2[i] - mean2
		num += diff1 * diff2
		den1 += diff1 * diff1
		den2 += diff2 * diff2
	}

	if den1 == 0 || den2 == 0 {
		return 0, false, fmt.Errorf("Foto polos / tidak ada kontur fitur wajah")
	}

	ncc := num / (math.Sqrt(den1) * math.Sqrt(den2))

	// Accurate NCC mathematical scaling
	var matchPct float64
	if ncc <= 0.10 {
		matchPct = 0.0
	} else {
		matchPct = math.Min(99.9, math.Max(0.0, ((ncc-0.10)/0.65)*100.0))
	}

	// Compare 4x4 spatial region histograms for face feature distribution
	const blocks = 4
	const blockSize = size / blocks
	var regionMatches int
	const totalRegions int = blocks * blocks

	for by := 0; by < blocks; by++ {
		for bx := 0; bx < blocks; bx++ {
			var rSum1, rSum2 float64
			for y := by * blockSize; y < (by+1)*blockSize; y++ {
				for x := bx * blockSize; x < (bx+1)*blockSize; x++ {
					rSum1 += m1[y*size+x]
					rSum2 += m2[y*size+x]
				}
			}
			rMean1 := rSum1 / float64(blockSize*blockSize)
			rMean2 := rSum2 / float64(blockSize*blockSize)

			if math.Abs(rMean1-rMean2) < 0.25 {
				regionMatches++
			}
		}
	}

	regionRatio := float64(regionMatches) / float64(totalRegions)

	// Combine scaled NCC score and region structural match ratio
	finalScore := math.Max(0, matchPct*0.80+regionRatio*20.0)
	if ncc <= 0.15 {
		finalScore = math.Min(10.0, finalScore)
	}

	// Require NCC >= 0.35 AND finalScore >= 45.0% for real mobile selfies
	isMatch := ncc >= 0.35 && finalScore >= 45.0

	return math.Min(99.9, math.Round(finalScore*10)/10), isMatch, nil
}

func (h *AttendanceHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("perPage", "10"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}

	response, err := h.repo.GetAll(page, perPage, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attendances"})
		return
	}
	c.JSON(http.StatusOK, response)
}

func (h *AttendanceHandler) CheckIn(c *gin.Context) {
	var payload struct {
		EmployeeID     int      `json:"employee_id"`
		Date           string   `json:"date"`
		WorkScheduleID *int     `json:"work_schedule_id"`
		Status         string   `json:"status"`
		ClockInTime    string   `json:"clock_in_time"`
		Notes          *string  `json:"notes"`
		Latitude       *float64 `json:"latitude"`
		Longitude      *float64 `json:"longitude"`
		Photo          string   `json:"photo"`
		IsMocked       bool     `json:"is_mocked"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Fake GPS Check
	if payload.IsMocked {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Fake GPS / Mock Location terdeteksi! Harap matikan aplikasi lokasi palsu."})
		return
	}

	// 2. Multi-Location Geofencing Check
	if payload.Latitude != nil && payload.Longitude != nil {
		if err := h.validateGeofence(*payload.Latitude, *payload.Longitude); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	// 3. Employee & Face Verification Check
	var emp *models.Employee

	// 3a. First priority: Get authenticated user_id from JWT Context
	if userIDVal, exists := c.Get("user_id"); exists {
		var tokenUserID int
		if v, ok := userIDVal.(float64); ok {
			tokenUserID = int(v)
		} else if v, ok := userIDVal.(int); ok {
			tokenUserID = v
		}
		if tokenUserID > 0 && h.employeeRepo != nil {
			emp, _ = h.employeeRepo.GetByUserID(tokenUserID)
		}
	}

	// 3b. Fallback: If JWT lookup produced no employee, try payload.EmployeeID
	if emp == nil && h.employeeRepo != nil && payload.EmployeeID > 0 {
		emp, _ = h.employeeRepo.GetByUserID(payload.EmployeeID)
		if emp == nil {
			emp, _ = h.employeeRepo.GetByID(payload.EmployeeID)
		}
	}

	if emp == nil || emp.ID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data pegawai tidak ditemukan untuk akun ini. Harap hubungi Admin HR."})
		return
	}

	realEmpID := emp.ID

	if emp.Photo == nil || *emp.Photo == "" {
		if payload.Photo == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Anda belum mendaftarkan foto wajah. Harap ambil foto selfie untuk mendaftarkan foto wajah."})
			return
		}
		// Auto-register face photo seamlessly on first check-in!
		regURL, err := saveAndRegisterFacePhoto(h, realEmpID, payload.Photo)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal mendaftarkan foto wajah otomatis: " + err.Error()})
			return
		}
		emp.Photo = &regURL
	} else if payload.Photo != "" {
		matchPct, isMatch, err := compareFacePhotos(*emp.Photo, payload.Photo)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal verifikasi presensi foto: " + err.Error()})
			return
		}
		if !isMatch {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Verifikasi Wajah Gagal: Wajah tidak cocok dengan data pendaftaran ID pegawai ini (Kemiripan: %.1f%%)", matchPct),
			})
			return
		}
	}

	now := time.Now()
	dateStr := payload.Date
	if dateStr == "" {
		dateStr = now.Format("2006-01-02")
	}
	timeStr := payload.ClockInTime
	if timeStr == "" {
		timeStr = now.Format("15:04:05")
	} else if len(timeStr) == 5 {
		timeStr += ":00"
	}

	status := payload.Status
	if status == "" {
		status = "present"
	}

	shiftStart, tolerance, autoWSID, ok := h.repo.GetWorkScheduleForEmployee(realEmpID, dateStr)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pegawai tidak memiliki jadwal pada tanggal tersebut"})
		return
	}

	existing, _ := h.repo.GetByEmployeeIDAndDate(realEmpID, dateStr)
	if existing != nil {
		if existing.ClockOut == nil {
			// Smart Auto-Divert to Check-Out if already checked in today!
			if err := h.repo.CheckOut(realEmpID, dateStr, timeStr); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal check-out: " + err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"id":        existing.ID,
				"message":   "Check-out berhasil (Presensi Pulang)",
				"action":    "check-out",
				"clock_out": timeStr,
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah melakukan Presensi Masuk & Pulang untuk hari ini."})
		return
	}

	attendance := models.Attendance{
		EmployeeID:     realEmpID,
		Date:           dateStr,
		ClockIn:        &timeStr,
		WorkScheduleID: payload.WorkScheduleID,
		Notes:          payload.Notes,
	}

	if attendance.WorkScheduleID != nil && *attendance.WorkScheduleID <= 0 {
		attendance.WorkScheduleID = nil
	}
	if attendance.WorkScheduleID == nil {
		attendance.WorkScheduleID = autoWSID
	}
	if status == "present" && shiftStart != "" {
		shiftT, _ := time.Parse("15:04:05", shiftStart)
		checkinT, _ := time.Parse("15:04:05", timeStr)
		diff := checkinT.Sub(shiftT).Minutes()
		if diff > float64(tolerance) {
			status = "late"
			attendance.LateMinutes = int(diff)
		}
	}
	attendance.Status = status

	if err := h.repo.CheckIn(&attendance); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check in: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, attendance)
}

func (h *AttendanceHandler) CheckOut(c *gin.Context) {
	var payload struct {
		EmployeeID   int      `json:"employee_id"`
		Date         string   `json:"date"`
		ClockOutTime string   `json:"clock_out_time"`
		Latitude     *float64 `json:"latitude"`
		Longitude    *float64 `json:"longitude"`
		Photo        string   `json:"photo"`
		IsMocked     bool     `json:"is_mocked"`
		Notes        *string  `json:"notes"`
		Status       *string  `json:"status"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Fake GPS Check
	if payload.IsMocked {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Fake GPS / Mock Location terdeteksi! Harap matikan aplikasi lokasi palsu."})
		return
	}

	// 2. Multi-Location Geofencing Check
	if payload.Latitude != nil && payload.Longitude != nil {
		if err := h.validateGeofence(*payload.Latitude, *payload.Longitude); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	// 3. Employee & Face Verification Check
	var emp *models.Employee

	// 3a. First priority: Get authenticated user_id from JWT Context
	if userIDVal, exists := c.Get("user_id"); exists {
		var tokenUserID int
		if v, ok := userIDVal.(float64); ok {
			tokenUserID = int(v)
		} else if v, ok := userIDVal.(int); ok {
			tokenUserID = v
		}
		if tokenUserID > 0 && h.employeeRepo != nil {
			emp, _ = h.employeeRepo.GetByUserID(tokenUserID)
		}
	}

	// 3b. Fallback: If JWT lookup produced no employee, try payload.EmployeeID
	if emp == nil && h.employeeRepo != nil && payload.EmployeeID > 0 {
		emp, _ = h.employeeRepo.GetByUserID(payload.EmployeeID)
		if emp == nil {
			emp, _ = h.employeeRepo.GetByID(payload.EmployeeID)
		}
	}

	if emp == nil || emp.ID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data pegawai tidak ditemukan untuk akun ini. Harap hubungi Admin HR."})
		return
	}

	realEmpID := emp.ID

	if emp.Photo == nil || *emp.Photo == "" {
		if payload.Photo == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Anda belum mendaftarkan foto wajah. Harap ambil foto selfie untuk mendaftarkan foto wajah."})
			return
		}
		// Auto-register face photo seamlessly on first check-out!
		regURL, err := saveAndRegisterFacePhoto(h, realEmpID, payload.Photo)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal mendaftarkan foto wajah otomatis: " + err.Error()})
			return
		}
		emp.Photo = &regURL
	} else if payload.Photo != "" {
		matchPct, isMatch, err := compareFacePhotos(*emp.Photo, payload.Photo)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal verifikasi presensi foto: " + err.Error()})
			return
		}
		if !isMatch {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Verifikasi Wajah Gagal: Wajah tidak cocok dengan data pendaftaran ID pegawai ini (Kemiripan: %.1f%%)", matchPct),
			})
			return
		}
	}

	now := time.Now()
	dateStr := payload.Date
	if dateStr == "" {
		dateStr = now.Format("2006-01-02")
	}
	timeStr := payload.ClockOutTime
	if timeStr == "" {
		timeStr = now.Format("15:04:05")
	} else if len(timeStr) == 5 {
		timeStr += ":00"
	}

	_, _, _, hasSchedule := h.repo.GetWorkScheduleForEmployee(realEmpID, dateStr)
	if !hasSchedule {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pegawai tidak memiliki jadwal pada tanggal tersebut"})
		return
	}

	existing, err := h.repo.GetByEmployeeIDAndDate(realEmpID, dateStr)
	if err != nil || existing == nil {
		// Smart Auto-Divert to CheckIn if no check-in record exists today!
		shiftStart, tolerance, autoWSID, _ := h.repo.GetWorkScheduleForEmployee(realEmpID, dateStr)
		status := "present"
		attendance := models.Attendance{
			EmployeeID:     realEmpID,
			Date:           dateStr,
			ClockIn:        &timeStr,
			WorkScheduleID: autoWSID,
		}
		if shiftStart != "" {
			shiftT, _ := time.Parse("15:04:05", shiftStart)
			checkinT, _ := time.Parse("15:04:05", timeStr)
			diff := checkinT.Sub(shiftT).Minutes()
			if diff > float64(tolerance) {
				status = "late"
				attendance.LateMinutes = int(diff)
			}
		}
		attendance.Status = status
		if err := h.repo.CheckIn(&attendance); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check in: " + err.Error()})
			return
		}
		c.JSON(http.StatusCreated, gin.H{
			"message":  "Check-in berhasil (Presensi Masuk)",
			"action":   "check-in",
			"clock_in": timeStr,
		})
		return
	}
	if existing.ClockOut != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah melakukan Presensi Masuk & Pulang untuk hari ini."})
		return
	}

	statusToSet := payload.Status
	if (statusToSet == nil || *statusToSet == "") && payload.Notes != nil && strings.Contains(*payload.Notes, "Pulang Cepat") {
		early := "early_leave"
		statusToSet = &early
	}

	if err := h.repo.CheckOutWithDetails(realEmpID, dateStr, timeStr, statusToSet, payload.Notes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check out: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Check-out berhasil", "clock_out": timeStr})
}

func (h *AttendanceHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var payload struct {
		ClockIn  *string `json:"clock_in"`
		ClockOut *string `json:"clock_out"`
		Status   string  `json:"status"`
		Notes    *string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	normalizeTime := func(t *string) *string {
		if t == nil || *t == "" {
			return nil
		}
		s := *t
		if len(s) == 5 {
			s = s + ":00"
		}
		return &s
	}
	clockIn := normalizeTime(payload.ClockIn)
	clockOut := normalizeTime(payload.ClockOut)

	if err := h.repo.Update(id, clockIn, clockOut, payload.Status, payload.Notes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal update: %v", err)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Absensi berhasil diupdate"})
}
