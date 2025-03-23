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
	var characters []models.Character
	result := r.db.Find(&characters)
	if result.Error != nil {
		return nil, result.Error
	}
	return characters, nil
}

func (r *CharacterRepo) GetById(id int) (*models.Character, error) {
	var character models.Character
	result := r.db.First(&character, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil // если запись не найдена
		}
		return nil, result.Error
	}
	return &character, nil
}

func (r *CharacterRepo) Create(data *models.Character) (*models.Character, error) {
	result := r.db.Create(data)
	if result.Error != nil {
		return nil, result.Error
	}
	return data, nil
}

func (r *CharacterRepo) Update(data *models.Character) (*models.Character, error) {
	var character models.Character
	result := r.db.First(&character, data.ID)
	if result.Error != nil {
		return nil, result.Error
	}
	result = r.db.Model(&character).Updates(data)
	if result.Error != nil {
		return nil, result.Error
	}
	return &character, nil
}

func (r *CharacterRepo) Delete(id int) error {
	result := r.db.Delete(&models.Character{}, id)
	if result.Error != nil {
		return result.Error
	}
	return nil
}
