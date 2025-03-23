package main

import (
	"warhammer-api/internal/database"
	"warhammer-api/internal/handlers"
	"warhammer-api/internal/repositories"
	"warhammer-api/internal/services"
	"warhammer-api/routes"
)

func main() {
	db := database.InitDB()

	raceRepo := repositories.NewRaceRepository(db)
	factionRepo := repositories.NewFactionRepository(db)
	characterRepo := repositories.NewCharacterRepository(db)

	raceService := services.NewRaceService(raceRepo)
	factionService := services.NewFactionService(factionRepo)
	characterService := services.NewCharacterService(characterRepo)

	raceHandler := handlers.NewRaceHandler(raceService)
	factionHandler := handlers.NewFactionHandler(factionService)
	characterHandler := handlers.NewCharacterHandler(characterService)

	r := routes.SetupRouter(raceHandler, factionHandler, characterHandler)

	r.Run(":8080")

}
