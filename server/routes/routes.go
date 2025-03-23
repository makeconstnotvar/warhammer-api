package routes

import (
	"github.com/gin-gonic/gin"
	"warhammer-api/internal/handlers"
)

func SetupRouter(
	raceHandler *handlers.RaceHandler,
	factionHandler *handlers.FactionHandler,
	characterHandler *handlers.CharacterHandler,
) *gin.Engine {
	r := gin.Default()

	// Фракции
	r.GET("/factions", factionHandler.GetAll)
	r.POST("/factions", factionHandler.Create)
	r.GET("/factions/:id", factionHandler.GetByID)
	r.PUT("/factions/:id", factionHandler.Update)
	r.DELETE("/factions/:id", factionHandler.Delete)

	// Персонажи
	r.GET("/characters", characterHandler.GetAll)
	r.POST("/characters", characterHandler.Create)
	r.GET("/characters/:id", characterHandler.GetByID)
	r.PUT("/characters/:id", characterHandler.Update)
	r.DELETE("/characters/:id", characterHandler.Delete)

	// Расы
	r.GET("/races", raceHandler.GetAll)
	r.POST("/races", raceHandler.Create)
	r.GET("/races/:id", raceHandler.GetByID)
	r.PUT("/races/:id", raceHandler.Update)
	r.DELETE("/races/:id", raceHandler.Delete)

	return r
}
