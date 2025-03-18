package main

import (
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"net/http"
)

var db *gorm.DB

// Модель фракции
type Faction struct {
	ID          uint   `gorm:"primaryKey"`
	Name        string `gorm:"unique;not null"`
	Description string
	RaceID      uint
	Characters  []Character `gorm:"foreignKey:FactionID"`
}

// Модель персонажа
type Character struct {
	ID          uint   `gorm:"primaryKey"`
	Name        string `gorm:"not null"`
	Description string
	Rank        string
	FactionID   uint
}

// Модель расы
type Race struct {
	ID          uint   `gorm:"primaryKey"`
	Name        string `gorm:"unique;not null"`
	Description string
	Factions    []Faction `gorm:"foreignKey:RaceID"`
}

// Инициализация БД
func initDB() {
	dsn := "host=localhost user=postgres password=qwerty dbname=warhammer port=5432 sslmode=disable"
	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Не удалось подключиться к базе данных")
	}
	db.AutoMigrate(&Faction{}, &Character{}, &Race{})
}

func main() {
	initDB()
	r := gin.Default()

	// Фракции
	r.GET("/factions", getFactions)
	r.POST("/factions", createFaction)
	r.GET("/factions/:id", getFactionByID)
	r.PUT("/factions/:id", updateFaction)
	r.DELETE("/factions/:id", deleteFaction)

	// Персонажи
	r.GET("/characters", getCharacters)
	r.POST("/characters", createCharacter)
	r.GET("/characters/:id", getCharacterByID)
	r.PUT("/characters/:id", updateCharacter)
	r.DELETE("/characters/:id", deleteCharacter)

	// Расы
	r.GET("/races", getRaces)
	r.POST("/races", createRace)
	r.GET("/races/:id", getRaceByID)
	r.PUT("/races/:id", updateRace)
	r.DELETE("/races/:id", deleteRace)

	r.Run(":8080")
}

// CRUD операции для фракций
func getFactions(c *gin.Context) {
	var factions []Faction
	db.Preload("Characters").Find(&factions)
	c.JSON(http.StatusOK, factions)
}

func createFaction(c *gin.Context) {
	var faction Faction
	if err := c.ShouldBindJSON(&faction); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Create(&faction)
	c.JSON(http.StatusCreated, faction)
}

func getFactionByID(c *gin.Context) {
	var faction Faction
	if err := db.Preload("Characters").First(&faction, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Фракция не найдена"})
		return
	}
	c.JSON(http.StatusOK, faction)
}

func updateFaction(c *gin.Context) {
	var faction Faction
	if err := db.First(&faction, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Фракция не найдена"})
		return
	}
	if err := c.ShouldBindJSON(&faction); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Save(&faction)
	c.JSON(http.StatusOK, faction)
}

func deleteFaction(c *gin.Context) {
	db.Delete(&Faction{}, c.Param("id"))
	c.Status(http.StatusNoContent)
}

// CRUD операции для персонажей
func getCharacters(c *gin.Context) {
	var characters []Character
	db.Find(&characters)
	c.JSON(http.StatusOK, characters)
}

func createCharacter(c *gin.Context) {
	var character Character
	if err := c.ShouldBindJSON(&character); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Create(&character)
	c.JSON(http.StatusCreated, character)
}

func getCharacterByID(c *gin.Context) {
	var character Character
	if err := db.First(&character, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Персонаж не найден"})
		return
	}
	c.JSON(http.StatusOK, character)
}

func updateCharacter(c *gin.Context) {
	var character Character
	if err := db.First(&character, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Персонаж не найден"})
		return
	}
	if err := c.ShouldBindJSON(&character); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Save(&character)
	c.JSON(http.StatusOK, character)
}

func deleteCharacter(c *gin.Context) {
	db.Delete(&Character{}, c.Param("id"))
	c.Status(http.StatusNoContent)
}

// CRUD операции для рас
func getRaces(c *gin.Context) {
	var races []Race
	db.Preload("Factions.Characters").Find(&races)
	c.JSON(http.StatusOK, races)
}

func createRace(c *gin.Context) {
	var race Race
	if err := c.ShouldBindJSON(&race); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Create(&race)
	c.JSON(http.StatusCreated, race)
}

func getRaceByID(c *gin.Context) {
	var race Race
	if err := db.First(&race, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Раса не найдена"})
		return
	}
	c.JSON(http.StatusOK, race)
}

func updateRace(c *gin.Context) {
	var race Race
	if err := db.First(&race, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Раса не найдена"})
		return
	}
	if err := c.ShouldBindJSON(&race); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Save(&race)
	c.JSON(http.StatusOK, race)
}

func deleteRace(c *gin.Context) {
	db.Delete(&Race{}, c.Param("id"))
	c.Status(http.StatusNoContent)
}
