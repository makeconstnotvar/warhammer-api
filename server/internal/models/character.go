package models

// Character Модель персонажа
type Character struct {
	ID          uint   `gorm:"primaryKey"`
	Name        string `gorm:"not null"`
	Description string
	Rank        string
	FactionID   uint `gorm:"not null"`
}
