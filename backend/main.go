package main

import (
	"backend/config"
	"backend/routes"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	portStr := os.Getenv("DB_PORT")
	port, _ := strconv.Atoi(portStr)
	if port == 0 {
		port = 5432
	}

	// Initialize database connection
	dbCfg := config.DBConfig{
		Host:     os.Getenv("DB_HOST"),
		Port:     port,
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		DBName:   os.Getenv("DB_NAME"),
		SSLMode:  os.Getenv("DB_SSLMODE"),
	}

	db := config.ConnectDB(dbCfg)
	defer db.Close()

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-super-secret-key-change-this"
	}

	// Setup Gin router
	r := routes.SetupRouter(db, jwtSecret)

	appPort := os.Getenv("PORT")
	if appPort == "" {
		appPort = "8080"
	}

	log.Printf("Starting server on :%s...", appPort)
	if err := r.Run(":" + appPort); err != nil {
		log.Fatalln("Failed to start server:", err)
	}
}
