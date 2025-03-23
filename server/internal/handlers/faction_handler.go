package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"warhammer-api/internal/models"
	"warhammer-api/internal/services"
)

type FactionHandler struct {
	service *services.FactionService
}

func NewFactionHandler(service *services.FactionService) *FactionHandler {
	return &FactionHandler{service}
}

func (h *FactionHandler) GetAll(c *gin.Context) {
	factions, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, factions)
}

func (h *FactionHandler) GetByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	faction, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if faction == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Faction not found"})
		return
	}
	c.JSON(http.StatusOK, faction)
}

func (h *FactionHandler) Create(c *gin.Context) {
	var data models.Faction
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	faction, err := h.service.Create(&data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, faction)
}

func (h *FactionHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var data models.Faction
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data.ID = uint(id)
	faction, err := h.service.Update(&data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, faction)
}

func (h *FactionHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.service.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
