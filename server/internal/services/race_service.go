package services

import (
	"errors"
	"warhammer-api/internal/models"
	"warhammer-api/internal/repositories"
)

type RaceService struct {
	repo repositories.RaceRepository
}

func NewRaceService(repo repositories.RaceRepository) *RaceService {
	return &RaceService{repo}
}

func (s *RaceService) GetAll() ([]models.Race, error) {
	return s.repo.GetAll()
}

func (s *RaceService) GetByID(id int) (*models.Race, error) {
	return s.repo.GetById(id)
}

func (s *RaceService) Create(data *models.Race) (*models.Race, error) {
	if data.Name == "" {
		return nil, errors.New("name cannot be empty")
	}
	return s.repo.Create(data)
}

func (s *RaceService) Update(data *models.Race) (*models.Race, error) {
	return s.repo.Update(data)
}

func (s *RaceService) Delete(id int) error {
	return s.repo.Delete(id)
}
