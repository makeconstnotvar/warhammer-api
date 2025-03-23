package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"warhammer-api/internal/models"
	"warhammer-api/internal/services"
)

type RaceHandler struct {
	service *services.RaceService
}

func NewRaceHandler(service *services.RaceService) *RaceHandler {
	return &RaceHandler{service}
}

func (h *RaceHandler) GetAll(c *gin.Context) {
	races, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, races)
}

func (h *RaceHandler) GetByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	race, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if race == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Race not found"})
		return
	}
	c.JSON(http.StatusOK, race)
}

func (h *RaceHandler) Create(c *gin.Context) {
	var data models.Race
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	race, err := h.service.Create(&data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, race)
}

func (h *RaceHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var data models.Race
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data.ID = uint(id)
	race, err := h.service.Update(&data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, race)
}

func (h *RaceHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.service.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
