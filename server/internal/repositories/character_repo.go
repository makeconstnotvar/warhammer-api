package repositories

import (
	"errors"
	"gorm.io/gorm"
	"warhammer-api/internal/models"
)

type CharacterRepository interface {
	GetAll() ([]models.Character, error)
	GetById(id int) (*models.Character, error)
	Create(data *models.Character) (*models.Character, error)
	Update(data *models.Character) (*models.Character, error)
	Delete(id int) error
}

type CharacterRepo struct {
	db *gorm.DB
}

func NewCharacterRepository(db *gorm.DB) CharacterRepository {
	return &CharacterRepo{db}
}

func (r *CharacterRepo) GetAll() ([]models.Character, error) {
	var factions []models.Character
	result := r.db.Preload("Characters").Find(&factions)
	if result.Error != nil {
		return nil, result.Error
	}
	return factions, nil
}

func (r *CharacterRepo) GetById(id int) (*models.Character, error) {
	var faction models.Character
	result := r.db.Preload("Characters").First(&faction, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil // если запись не найдена
		}
		return nil, result.Error
	}
	return &faction, nil
}

func (r *CharacterRepo) Create(data *models.Character) (*models.Character, error) {
	result := r.db.Create(data)
	if result.Error != nil {
		return nil, result.Error
	}
	return data, nil
}

func (r *CharacterRepo) Update(data *models.Character) (*models.Character, error) {
	var faction models.Character
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

func (r *CharacterRepo) Delete(id int) error {
	result := r.db.Delete(&models.Character{}, id)
	if result.Error != nil {
		return result.Error
	}
	return nil
}
