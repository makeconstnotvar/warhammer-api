const raceService = require('../services/raceService');

class RaceHandler {
	async getAll(request, reply) {
		try {
			const races = await raceService.getAll();
			return races;
		} catch (error) {
			reply.code(500).send({ error: error.message });
		}
	}

	async getById(request, reply) {
		try {
			const { id } = request.params;
			const race = await raceService.getById(id);
			return race;
		} catch (error) {
			reply.code(404).send({ error: error.message });
		}
	}

	async create(request, reply) {
		try {
			const raceData = request.body;
			const race = await raceService.create(raceData);
			reply.code(201);
			return race;
		} catch (error) {
			reply.code(400).send({ error: error.message });
		}
	}

	async update(request, reply) {
		try {
			const { id } = request.params;
			const raceData = request.body;
			const updated = await raceService.update(id, raceData);
			return updated;
		} catch (error) {
			reply.code(404).send({ error: error.message });
		}
	}

	async delete(request, reply) {
		try {
			const { id } = request.params;
			const deleted = await raceService.delete(id);
			return deleted;
		} catch (error) {
			reply.code(404).send({ error: error.message });
		}
	}
}

module.exports = new RaceHandler();