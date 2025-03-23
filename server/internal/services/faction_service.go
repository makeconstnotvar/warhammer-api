package services

import (
	"errors"
	"warhammer-api/internal/models"
	"warhammer-api/internal/repositories"
)

type FactionService struct {
	repo repositories.FactionRepository
}

func NewFactionService(repo repositories.FactionRepository) *FactionService {
	return &FactionService{repo}
}

func (s *FactionService) GetAll() ([]models.Faction, error) {
	return s.repo.GetAll()
}

func (s *FactionService) GetByID(id int) (*models.Faction, error) {
	return s.repo.GetById(id)
}

func (s *FactionService) Create(data *models.Faction) (*models.Faction, error) {
	if data.Name == "" {
		return nil, errors.New("name cannot be empty")
	}
	return s.repo.Create(data)
}

func (s *FactionService) Update(data *models.Faction) (*models.Faction, error) {
	return s.repo.Update(data)
}

func (s *FactionService) Delete(id int) error {
	return s.repo.Delete(id)
}
