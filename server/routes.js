function setupRouter(fastify, raceHandler, factionHandler, characterHandler) {
    // Регистрируем все маршруты с общим префиксом /api
    fastify.register((instance, opts, done) => {
        // Фракции
        instance.get('/factions', factionHandler.getAll);
        instance.post('/factions', factionHandler.create);
        instance.get('/factions/:id', factionHandler.getById);
        instance.put('/factions/:id', factionHandler.update);
        instance.delete('/factions/:id', factionHandler.delete);

        // Персонажи
        instance.get('/characters', characterHandler.getAll);
        instance.post('/characters', characterHandler.create);
        instance.get('/characters/:id', characterHandler.getById);
        instance.put('/characters/:id', characterHandler.update);
        instance.delete('/characters/:id', characterHandler.delete);

        // Расы
        instance.get('/races', raceHandler.getAll);
        instance.post('/races', raceHandler.create);
        instance.get('/races/:id', raceHandler.getById);
        instance.put('/races/:id', raceHandler.update);
        instance.delete('/races/:id', raceHandler.delete);

        done();
    }, { prefix: '/api' });
}

module.exports = { setupRouter };