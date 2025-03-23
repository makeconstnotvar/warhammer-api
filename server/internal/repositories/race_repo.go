package repositories

import (
	"gorm.io/gorm"
	"warhammer-api/internal/models"
)

type RaceRepository interface {
	GetAll() ([]models.Race, error)
	GetById(id int) (*models.Race, error)
	Create(data *models.Race) (*models.Race, error)
	Update(data *models.Race) (*models.Race, error)
	Delete(id int) error
}
type RaceRepo struct {
	db *gorm.DB
}

func NewRaceRepository(db *gorm.DB) RaceRepository {
	return &RaceRepo{db}
}

func (r *RaceRepo) GetAll() ([]models.Race, error) {
	var races []models.Race
	result := r.db.Preload("Factions.Characters").Find(&races)
	if result.Error != nil {
		return nil, result.Error
	}
	return races, nil
}

func (r *RaceRepo) GetById(id int) (*models.Race, error) {
	var race models.Race
	result := r.db.First(&race, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &race, nil
}

func (r *RaceRepo) Create(data *models.Race) (*models.Race, error) {
	result := r.db.Create(data)
	if result.Error != nil {
		return nil, result.Error
	}
	return data, nil
}

func (r *RaceRepo) Update(data *models.Race) (*models.Race, error) {
	var race models.Race
	result := r.db.First(&race, data.ID)
	if result.Error != nil {
		return nil, result.Error
	}
	result = r.db.Model(&race).Updates(data)
	if result.Error != nil {
		return nil, result.Error
	}
	return &race, nil
}

func (r *RaceRepo) Delete(id int) error {
	result := r.db.Delete(&models.Race{}, id)
	if result.Error != nil {
		return result.Error
	}
	return nil
}
