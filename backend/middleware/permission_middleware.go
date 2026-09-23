package middleware

import (
	"backend/repository"
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequirePermission is a middleware that checks if the logged-in user has the required permission
func RequirePermission(roleRepo *repository.RoleRepository, requiredPermission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get role_id from context (set by JWTAuthMiddleware)
		roleIDValue, exists := c.Get("role_id")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: role not found in token"})
			return
		}

		// Convert roleID to float64 (JWT numeric types are parsed as float64) and then int
		var roleID int
		if v, ok := roleIDValue.(float64); ok {
			roleID = int(v)
		} else if v, ok := roleIDValue.(int); ok {
			roleID = v
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: invalid role format"})
			return
		}

		// Fetch permissions for this role
		permissions, err := roleRepo.GetPermissionsByRoleID(roleID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify permissions"})
			return
		}

		hasAccess := false
		for _, perm := range permissions {
			if perm == requiredPermission {
				hasAccess = true
				break
			}
		}

		if !hasAccess {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden: You don't have permission to perform this action"})
			return
		}

		c.Next()
	}
}
