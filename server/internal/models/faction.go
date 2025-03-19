package models

// Faction Модель фракции
type Faction struct {
	ID          uint   `gorm:"primaryKey"`
	Name        string `gorm:"unique;not null"`
	Description string
	RaceID      uint
	Characters  []Character `gorm:"foreignKey:FactionID"`
}
