package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"warhammer-api/internal/models"
	"warhammer-api/internal/services"
)

type CharacterHandler struct {
	service *services.CharacterService
}

func NewCharacterHandler(service *services.CharacterService) *CharacterHandler {
	return &CharacterHandler{service}
}

func (h *CharacterHandler) GetAll(c *gin.Context) {
	characters, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, characters)
}

func (h *CharacterHandler) GetByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	character, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if character == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Faction not found"})
		return
	}
	c.JSON(http.StatusOK, character)
}

func (h *CharacterHandler) Create(c *gin.Context) {
	var data models.Character
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	character, err := h.service.Create(&data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, character)
}

func (h *CharacterHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var data models.Character
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data.ID = uint(id)
	character, err := h.service.Update(&data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, character)
}

func (h *CharacterHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.service.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
