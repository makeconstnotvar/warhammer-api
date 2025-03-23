package services

import (
	"errors"
	"warhammer-api/internal/models"
	"warhammer-api/internal/repositories"
)

type CharacterService struct {
	repo repositories.CharacterRepository
}

func NewCharacterService(repo repositories.CharacterRepository) *CharacterService {
	return &CharacterService{repo}
}

func (s *CharacterService) GetAll() ([]models.Character, error) {
	return s.repo.GetAll()
}

func (s *CharacterService) GetByID(id int) (*models.Character, error) {
	return s.repo.GetById(id)
}

func (s *CharacterService) Create(data *models.Character) (*models.Character, error) {
	if data.Name == "" {
		return nil, errors.New("name cannot be empty")
	}
	return s.repo.Create(data)
}

func (s *CharacterService) Update(data *models.Character) (*models.Character, error) {
	return s.repo.Update(data)
}

func (s *CharacterService) Delete(id int) error {
	return s.repo.Delete(id)
}
