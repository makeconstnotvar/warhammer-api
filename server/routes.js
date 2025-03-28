const express = require('express');
const {factionHandler} = require("./handlers/factionHandler");
const {characterHandler} = require("./handlers/characterHandler");
const {raceHandler} = require("./handlers/raceHandler");

// Фракции
const apiRoutes = express.Router();

apiRoutes.get('/factions', factionHandler.getAll);
apiRoutes.post('/factions', factionHandler.create);
apiRoutes.get('/factions/:id', factionHandler.getById);
apiRoutes.put('/factions/:id', factionHandler.update);
apiRoutes.delete('/factions/:id', factionHandler.delete);

// Персонажи
apiRoutes.get('/characters', characterHandler.getAll);
apiRoutes.post('/characters', characterHandler.create);
apiRoutes.get('/characters/:id', characterHandler.getById);
apiRoutes.put('/characters/:id', characterHandler.update);
apiRoutes.delete('/characters/:id', characterHandler.delete);

// Расы
apiRoutes.get('/races', raceHandler.getAll);
apiRoutes.post('/races', raceHandler.create);
apiRoutes.get('/races/:id', raceHandler.getById);
apiRoutes.put('/races/:id', raceHandler.update);
apiRoutes.delete('/races/:id', raceHandler.delete);

apiRoutes.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({error: 'Internal Server Error'});
});


module.exports = {apiRoutes};