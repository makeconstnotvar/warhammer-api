package database

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"warhammer-api/internal/models"
)

var DB *gorm.DB

// InitDB инициализирует подключение к базе данных
func InitDB() *gorm.DB {
	// Загружаем переменные окружения
	err := godotenv.Load()
	if err != nil {
		log.Println("Не удалось загрузить .env файл, используются стандартные переменные окружения")
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_PASSWORD", "password"),
		getEnv("DB_NAME", "warhammer"),
		getEnv("DB_PORT", "5432"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Ошибка подключения к базе данных:", err)
	}

	// Автоматическая миграция
	err = db.AutoMigrate(&models.Race{}, &models.Faction{}, &models.Character{})
	if err != nil {
		log.Fatal("Ошибка миграции:", err)
	}

	log.Println("База данных подключена успешно")
	DB = db
	return DB
}

// getEnv возвращает значение переменной окружения или дефолтное значение
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
