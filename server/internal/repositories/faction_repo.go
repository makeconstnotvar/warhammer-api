package repositories

import (
	"errors"
	"gorm.io/gorm"
	"warhammer-api/internal/models"
)

type FactionRepository interface {
	GetAll() ([]models.Faction, error)
	GetById(id int) (*models.Faction, error)
	Create(data *models.Faction) (*models.Faction, error)
	Update(data *models.Faction) (*models.Faction, error)
	Delete(id int) error
}

type FactionRepo struct {
	db *gorm.DB
}

func NewFactionRepository(db *gorm.DB) FactionRepository {
	return &FactionRepo{db}
}

func (r *FactionRepo) GetAll() ([]models.Faction, error) {
	var factions []models.Faction
	result := r.db.Preload("Characters").Find(&factions)
	if result.Error != nil {
		return nil, result.Error
	}
	return factions, nil
}

func (r *FactionRepo) GetById(id int) (*models.Faction, error) {
	var faction models.Faction
	result := r.db.Preload("Characters").First(&faction, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil // если запись не найдена
		}
		return nil, result.Error
	}
	return &faction, nil
}

func (r *FactionRepo) Create(data *models.Faction) (*models.Faction, error) {
	result := r.db.Create(data)
	if result.Error != nil {
		return nil, result.Error
	}
	return data, nil
}

func (r *FactionRepo) Update(data *models.Faction) (*models.Faction, error) {
	var faction models.Faction
	result := r.db.First(&faction, data.ID)
	if result.Error != nil {
		return nil, result.Error
	}
	result = r.db.Model(&faction).Updates(data)
	if result.Error != nil {
		return nil, result.Error
	}
	return &faction, nil
}

func (r *FactionRepo) Delete(id int) error {
	result := r.db.Delete(&models.Faction{}, id)
	if result.Error != nil {
		return result.Error
	}
	return nil
}
