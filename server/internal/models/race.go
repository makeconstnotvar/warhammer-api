package models

// Race Модель расы
type Race struct {
	ID          uint   `gorm:"primaryKey"`
	Name        string `gorm:"unique;not null"`
	Description string
	//Factions    []Faction `gorm:"foreignKey:RaceID"`
}
