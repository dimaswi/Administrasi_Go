package routes

import (
	"backend/handler"
	"backend/middleware"
	"backend/repository"
	"backend/service"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func SetupRouter(db *sqlx.DB, jwtSecret string) *gin.Engine {
	r := gin.Default()

	// Serve static files for uploads
	r.Static("/uploads", "./uploads")

	// Enable CORS
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Disposition")
		c.Writer.Header().Add("Vary", "Origin")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Setup Repositories
	userRepo := repository.NewUserRepository(db)
	orgUnitRepo := repository.NewOrgUnitRepository(db)
	employeeRepo := repository.NewEmployeeRepository(db)
	workScheduleRepo := repository.NewWorkScheduleRepository(db)
	leaveRepo := repository.NewLeaveRepository(db)
	incomingLetterRepo := repository.NewIncomingLetterRepository(db)
	dispositionRepo := repository.NewDispositionRepository(db)
	jobCategoryRepo := repository.NewJobCategoryRepository(db)
	employmentStatusRepo := repository.NewEmploymentStatusRepository(db)
	educationLevelRepo := repository.NewEducationLevelRepository(db)
	leaveTypeRepo := repository.NewLeaveTypeRepository(db)
	roleRepo := repository.NewRoleRepository(db)
	permissionRepo := repository.NewPermissionRepository(db)
	roomRepo := repository.NewRoomRepository(db)
	meetingRepo := repository.NewMeetingRepository(db)
	settingRepo := repository.NewSettingRepository(db)
	shiftExchangeRepo := repository.NewShiftExchangeRepository(db)
	documentTemplateRepo := repository.NewDocumentTemplateRepository(db)
	outgoingLetterRepo := repository.NewOutgoingLetterRepository(db)

	// Setup Services
	authService := service.NewAuthService(userRepo, roleRepo, jwtSecret)

	// Setup Handlers
	authHandler := handler.NewAuthHandler(authService)
	orgUnitHandler := handler.NewOrgUnitHandler(orgUnitRepo)
	employeeHandler := handler.NewEmployeeHandler(employeeRepo, userRepo)
	workScheduleHandler := handler.NewWorkScheduleHandler(workScheduleRepo)
	leaveHandler := handler.NewLeaveHandler(leaveRepo)
	incomingLetterHandler := handler.NewIncomingLetterHandler(incomingLetterRepo)
	dispositionHandler := handler.NewDispositionHandler(dispositionRepo, incomingLetterRepo)
	documentTemplateHandler := handler.NewDocumentTemplateHandler(documentTemplateRepo)
	outgoingLetterHandler := handler.NewOutgoingLetterHandler(outgoingLetterRepo)
	employeeScheduleRepo := repository.NewEmployeeScheduleRepository(db)
	employeeScheduleHandler := handler.NewEmployeeScheduleHandler(employeeScheduleRepo)
	rosterScheduleRepo := repository.NewRosterScheduleRepository(db)
	rosterScheduleHandler := handler.NewRosterScheduleHandler(rosterScheduleRepo)
	workLocationRepo := repository.NewWorkLocationRepository(db)
	workLocationHandler := handler.NewWorkLocationHandler(workLocationRepo)
	attendanceRepo := repository.NewAttendanceRepository(db)
	attendanceHandler := handler.NewAttendanceHandler(attendanceRepo, settingRepo, employeeRepo, workLocationRepo)
	jobCategoryHandler := handler.NewJobCategoryHandler(jobCategoryRepo)
	employmentStatusHandler := handler.NewEmploymentStatusHandler(employmentStatusRepo)
	educationLevelHandler := handler.NewEducationLevelHandler(educationLevelRepo)
	leaveTypeHandler := handler.NewLeaveTypeHandler(leaveTypeRepo)
	userHandler := handler.NewUserHandler(userRepo)
	roleHandler := handler.NewRoleHandler(roleRepo)
	permissionHandler := handler.NewPermissionHandler(permissionRepo)
	roomHandler := handler.NewRoomHandler(roomRepo)
	meetingHandler := handler.NewMeetingHandler(meetingRepo)
	settingHandler := handler.NewSettingHandler(settingRepo)
	shiftExchangeHandler := handler.NewShiftExchangeHandler(shiftExchangeRepo, rosterScheduleRepo)

	employeeDetailRepo := repository.NewEmployeeDetailRepository(db)
	employeeDetailHandler := handler.NewEmployeeDetailHandler(employeeDetailRepo)

	api := r.Group("/api")
	{
		// Public routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
		}

		api.GET("/settings", settingHandler.GetAll)
		api.GET("/verify/outgoing-letters/:id", outgoingLetterHandler.Verify)

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.JWTAuthMiddleware(jwtSecret))
		{
			// Auth User Info
			protected.GET("/auth/me", authHandler.Me)
			// Organization Units
			orgUnits := protected.Group("/org-units")
			{
				orgUnits.GET("", orgUnitHandler.GetAll)
				orgUnits.GET("/:id", orgUnitHandler.GetByID)
				orgUnits.POST("", orgUnitHandler.Create)
				orgUnits.PUT("/:id", orgUnitHandler.Update)
				orgUnits.DELETE("/:id", orgUnitHandler.Delete)
			}

			// Master Data - Job Categories
			jobCategories := protected.Group("/job-categories")
			{
				jobCategories.GET("", jobCategoryHandler.GetAll)
				jobCategories.GET("/:id", jobCategoryHandler.GetByID)
				jobCategories.POST("", jobCategoryHandler.Create)
				jobCategories.PUT("/:id", jobCategoryHandler.Update)
				jobCategories.DELETE("/:id", jobCategoryHandler.Delete)
			}

			// Master Data - Employment Statuses
			employmentStatuses := protected.Group("/employment-statuses")
			{
				employmentStatuses.GET("", employmentStatusHandler.GetAll)
				employmentStatuses.GET("/:id", employmentStatusHandler.GetByID)
				employmentStatuses.POST("", employmentStatusHandler.Create)
				employmentStatuses.PUT("/:id", employmentStatusHandler.Update)
				employmentStatuses.DELETE("/:id", employmentStatusHandler.Delete)
			}

			// Master Data - Education Levels
			educationLevels := protected.Group("/education-levels")
			{
				educationLevels.GET("", educationLevelHandler.GetAll)
				educationLevels.GET("/:id", educationLevelHandler.GetByID)
				educationLevels.POST("", educationLevelHandler.Create)
				educationLevels.PUT("/:id", educationLevelHandler.Update)
				educationLevels.DELETE("/:id", educationLevelHandler.Delete)
			}

			// Master Data - Leave Types
			leaveTypes := protected.Group("/leave-types")
			{
				leaveTypes.GET("", leaveTypeHandler.GetAll)
				leaveTypes.GET("/:id", leaveTypeHandler.GetByID)
				leaveTypes.POST("", leaveTypeHandler.Create)
				leaveTypes.PUT("/:id", leaveTypeHandler.Update)
				leaveTypes.DELETE("/:id", leaveTypeHandler.Delete)
			}

			// Access Management - Users
			users := protected.Group("/users")
			{
				users.GET("", userHandler.GetAll)
				users.GET("/:id", userHandler.GetByID)
				users.POST("", userHandler.Create)
				users.PUT("/:id", userHandler.Update)
				users.DELETE("/:id", userHandler.Delete)
			}

			// Access Management - Roles
			roles := protected.Group("/roles")
			{
				roles.GET("", roleHandler.GetAll)
				roles.GET("/:id", roleHandler.GetByID)
				roles.POST("", roleHandler.Create)
				roles.PUT("/:id", roleHandler.Update)
				roles.DELETE("/:id", roleHandler.Delete)
				roles.GET("/:id/permissions", roleHandler.GetPermissions)
				roles.POST("/:id/permissions", roleHandler.AssignPermissions)
			}

			// Access Management - Permissions
			permissions := protected.Group("/permissions")
			{
				permissions.GET("", permissionHandler.GetAll)
				permissions.GET("/:id", permissionHandler.GetByID)
				permissions.POST("", permissionHandler.Create)
				permissions.PUT("/:id", permissionHandler.Update)
				permissions.DELETE("/:id", permissionHandler.Delete)
			}

			// Employees
			employees := protected.Group("/employees")
			{
				employees.GET("", employeeHandler.GetAll)
				employees.GET("/:id", employeeHandler.GetByID)
				employees.GET("/by-user/:userId", employeeHandler.GetByUserID)
				employees.POST("", employeeHandler.Create)
				employees.PUT("/:id", employeeHandler.Update)
				employees.POST("/:id/account", employeeHandler.ManageAccount)
				employees.POST("/:id/register-face", employeeHandler.RegisterFace)

				// Employee Details - Family
				employees.GET("/:id/families", employeeDetailHandler.GetFamilies)
				employees.POST("/:id/families", employeeDetailHandler.CreateFamily)
				employees.PUT("/:id/families/:detailId", employeeDetailHandler.UpdateFamily)
				employees.DELETE("/:id/families/:detailId", employeeDetailHandler.DeleteFamily)

				// Employee Details - Education
				employees.GET("/:id/educations", employeeDetailHandler.GetEducations)
				employees.POST("/:id/educations", employeeDetailHandler.CreateEducation)
				employees.PUT("/:id/educations/:detailId", employeeDetailHandler.UpdateEducation)
				employees.DELETE("/:id/educations/:detailId", employeeDetailHandler.DeleteEducation)

				// Employee Details - Work History
				employees.GET("/:id/work-histories", employeeDetailHandler.GetWorkHistories)
				employees.POST("/:id/work-histories", employeeDetailHandler.CreateWorkHistory)
				employees.PUT("/:id/work-histories/:detailId", employeeDetailHandler.UpdateWorkHistory)
				employees.DELETE("/:id/work-histories/:detailId", employeeDetailHandler.DeleteWorkHistory)
			}

			// Work Schedules
			workSchedules := protected.Group("/work-schedules")
			{
				workSchedules.GET("", workScheduleHandler.GetAll)
				workSchedules.GET("/:id", workScheduleHandler.GetByID)
				workSchedules.POST("", workScheduleHandler.Create)
				workSchedules.PUT("/:id", workScheduleHandler.Update)
				workSchedules.DELETE("/:id", workScheduleHandler.Delete)
			}

			// Leaves
			leaves := protected.Group("/leaves")
			{
				leaves.GET("", leaveHandler.GetAll)
				leaves.GET("/:id", leaveHandler.GetByID)
				leaves.POST("", leaveHandler.Create)
				leaves.PUT("/:id/status", leaveHandler.UpdateStatus)
			}

			// Employee Schedules
			employeeSchedules := protected.Group("/employee-schedules")
			{
				employeeSchedules.GET("", employeeScheduleHandler.GetAll)
				employeeSchedules.POST("", employeeScheduleHandler.Create)
			}

			// Roster Schedules
			rosterSchedules := protected.Group("/roster-schedules")
			{
				rosterSchedules.GET("", rosterScheduleHandler.GetAll)
				rosterSchedules.POST("", rosterScheduleHandler.Create)
				rosterSchedules.GET("/unit/:unit_id/:year_month", rosterScheduleHandler.GetByUnitAndMonth)
				rosterSchedules.POST("/assign", rosterScheduleHandler.AssignShift)
				rosterSchedules.POST("/auto-generate", rosterScheduleHandler.AutoGenerate)
			}

			// Shift Exchanges
			shiftExchanges := protected.Group("/shift-exchanges")
			{
				shiftExchanges.GET("", shiftExchangeHandler.GetAll)
				shiftExchanges.POST("", shiftExchangeHandler.Create)
				shiftExchanges.PUT("/:id/status", shiftExchangeHandler.UpdateStatus)
			}

			// Work Locations (Geofencing Master)
			workLocations := protected.Group("/work-locations")
			{
				workLocations.GET("", workLocationHandler.GetAll)
				workLocations.GET("/:id", workLocationHandler.GetByID)
				workLocations.POST("", workLocationHandler.Create)
				workLocations.PUT("/:id", workLocationHandler.Update)
				workLocations.DELETE("/:id", workLocationHandler.Delete)
			}

			// Attendances
			attendances := protected.Group("/attendances")
			{
				attendances.GET("", attendanceHandler.GetAll)
				attendances.POST("/check-in", attendanceHandler.CheckIn)
				attendances.POST("/check-out", attendanceHandler.CheckOut)
				attendances.PUT("/:id", attendanceHandler.Update)
			}

			// Incoming Letters
			incomingLetters := protected.Group("/incoming-letters")
			{
				incomingLetters.GET("", middleware.RequirePermission(roleRepo, "incoming_letter.view"), incomingLetterHandler.Index)
				incomingLetters.GET("/:id", middleware.RequirePermission(roleRepo, "incoming_letter.view"), incomingLetterHandler.Show)
				incomingLetters.POST("", middleware.RequirePermission(roleRepo, "incoming_letter.create"), incomingLetterHandler.Create)
				incomingLetters.PUT("/:id", middleware.RequirePermission(roleRepo, "incoming_letter.edit"), incomingLetterHandler.Update)
				incomingLetters.DELETE("/:id", middleware.RequirePermission(roleRepo, "incoming_letter.delete"), incomingLetterHandler.Delete)

				// Dispositions for a specific letter
				incomingLetters.GET("/:id/dispositions", middleware.RequirePermission(roleRepo, "disposition.view"), dispositionHandler.GetByLetter)
			}

			// Document Templates
			documentTemplates := protected.Group("/document-templates")
			{
				documentTemplates.GET("", middleware.RequirePermission(roleRepo, "document_template.view"), documentTemplateHandler.GetAll)
				documentTemplates.GET("/:id", middleware.RequirePermission(roleRepo, "document_template.view"), documentTemplateHandler.GetByID)
				documentTemplates.POST("", middleware.RequirePermission(roleRepo, "document_template.create"), documentTemplateHandler.Create)
				documentTemplates.PUT("/:id", middleware.RequirePermission(roleRepo, "document_template.edit"), documentTemplateHandler.Update)
				documentTemplates.DELETE("/:id", middleware.RequirePermission(roleRepo, "document_template.delete"), documentTemplateHandler.Delete)
			}

			// Outgoing Letters
			outgoingLetters := protected.Group("/outgoing-letters")
			{
				outgoingLetters.GET("", middleware.RequirePermission(roleRepo, "outgoing_letter.view"), outgoingLetterHandler.GetAll)
				outgoingLetters.GET("/:id", middleware.RequirePermission(roleRepo, "outgoing_letter.view"), outgoingLetterHandler.GetByID)
				outgoingLetters.POST("", middleware.RequirePermission(roleRepo, "outgoing_letter.create"), outgoingLetterHandler.Create)
				outgoingLetters.PUT("/:id", middleware.RequirePermission(roleRepo, "outgoing_letter.edit"), outgoingLetterHandler.Update)
				outgoingLetters.PUT("/:id/submit", middleware.RequirePermission(roleRepo, "outgoing_letter.submit"), outgoingLetterHandler.Submit)
				outgoingLetters.PUT("/:id/sign", middleware.RequirePermission(roleRepo, "outgoing_letter.sign"), outgoingLetterHandler.SignLetter)
				outgoingLetters.PUT("/:id/reject", middleware.RequirePermission(roleRepo, "outgoing_letter.sign"), outgoingLetterHandler.RejectLetter)
				outgoingLetters.GET("/:id/pdf", outgoingLetterHandler.GeneratePDF)
			}

			// Dispositions
			dispositions := protected.Group("/dispositions")
			{
				dispositions.GET("", middleware.RequirePermission(roleRepo, "disposition.view"), dispositionHandler.GetMyDispositions)
				dispositions.POST("", middleware.RequirePermission(roleRepo, "disposition.create"), dispositionHandler.Create)
				dispositions.PUT("/:id/status", middleware.RequirePermission(roleRepo, "disposition.update_status"), dispositionHandler.UpdateStatus)
			}

			// Rooms
			rooms := protected.Group("/rooms")
			{
				rooms.GET("", middleware.RequirePermission(roleRepo, "room.view"), roomHandler.GetAll)
				rooms.GET("/:id", middleware.RequirePermission(roleRepo, "room.view"), roomHandler.GetByID)
				rooms.POST("", middleware.RequirePermission(roleRepo, "room.create"), roomHandler.Create)
				rooms.PUT("/:id", middleware.RequirePermission(roleRepo, "room.edit"), roomHandler.Update)
				rooms.DELETE("/:id", middleware.RequirePermission(roleRepo, "room.delete"), roomHandler.Delete)
			}

			// Meetings
			meetings := protected.Group("/meetings")
			{
				meetings.GET("", meetingHandler.GetAll)
				meetings.GET("/:id", meetingHandler.GetByID)
				meetings.POST("", meetingHandler.Create)
				meetings.PUT("/:id", middleware.RequirePermission(roleRepo, "meeting.edit"), meetingHandler.Update)
				meetings.DELETE("/:id", middleware.RequirePermission(roleRepo, "meeting.delete"), meetingHandler.Delete)

				// Lifecycle
				meetings.POST("/:id/start", meetingHandler.StartMeeting)
				meetings.PUT("/:id/complete", meetingHandler.CompleteMeeting)
				meetings.POST("/:id/cancel", meetingHandler.CancelMeeting)

				// Participants
				meetings.GET("/:id/participants", meetingHandler.GetParticipants)
				meetings.POST("/:id/participants", meetingHandler.AddParticipant)
				meetings.DELETE("/:id/participants/:participantId", meetingHandler.RemoveParticipant)
				meetings.PUT("/:id/participants/:participantId/attendance", meetingHandler.UpdateAttendance)

				// Action Items
				meetings.GET("/:id/action-items", meetingHandler.GetActionItems)
				meetings.POST("/:id/action-items", meetingHandler.CreateActionItem)
				meetings.PUT("/:id/action-items/:itemId", meetingHandler.UpdateActionItem)
				meetings.DELETE("/:id/action-items/:itemId", meetingHandler.DeleteActionItem)

				// Docs
				meetings.GET("/:id/generate-memo", meetingHandler.GenerateMemo)
				meetings.GET("/:id/generate-attendance", meetingHandler.GenerateAttendance)
				meetings.GET("/:id/generate-invitation", meetingHandler.GenerateInvitation)

				// Features
				meetings.POST("/:id/check-in", meetingHandler.CheckIn)
				meetings.POST("/check-in-by-token", meetingHandler.CheckInByToken)
				meetings.PUT("/:id/memo", meetingHandler.UpdateMemo)
				meetings.POST("/:id/generate-checkin-token", meetingHandler.GenerateCheckinToken)
			}

			// Settings
			settings := protected.Group("/settings")
			{
				settings.PUT("", settingHandler.Update)
				settings.POST("/upload-logo", settingHandler.UploadLogo)
				settings.POST("/upload-icon", settingHandler.UploadIcon)
			}
		}
	}

	return r
}
