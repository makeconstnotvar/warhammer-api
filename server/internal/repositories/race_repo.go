package repositories

import (
	"gorm.io/gorm"
	"warhammer-api/internal/models"
)

type RaceRepository struct {
	DB *gorm.DB
}

func (r *RaceRepository) GetAllRaces() ([]models.Race, error) {
	var races []models.Race
	err := r.DB.Preload("Factions.Characters").Find(&races).Error
	return races, err
}

func (r *RaceRepository) CreateRace(race *models.Race) error {
	err := r.DB.Create(race).Error
	return err
}

func (r *RaceRepository) GetRaceById(id int) (*models.Race, error) {
	var race models.Race
	err := r.DB.First(&race, id).Error
	return &race, err
}

func (r *RaceRepository) UpdateRace(data models.Race) (*models.Race, error) {
	var race models.Race
	err := r.DB.First(&race, data.ID).Error
	if err != nil {
		return nil, err
	}
	err = r.DB.Model(&race).Updates(data).Error
	return &race, err
}

func (r *RaceRepository) DeleteRace(id int) error {
	err := r.DB.Delete(&models.Race{}, id).Error
	return err
}
