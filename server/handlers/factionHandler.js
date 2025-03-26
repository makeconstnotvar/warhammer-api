const factionService = require('../services/factionService');

class FactionHandler {
	async getAll(request, reply) {
		try {
			const factions = await factionService.getAll();
			return factions;
		} catch (error) {
			reply.code(500).send({ error: error.message });
		}
	}

	async getById(request, reply) {
		try {
			const { id } = request.params;
			const faction = await factionService.getById(id);
			return faction;
		} catch (error) {
			reply.code(404).send({ error: error.message });
		}
	}

	async create(request, reply) {
		try {
			const factionData = request.body;
			const faction = await factionService.create(factionData);
			reply.code(201);
			return faction;
		} catch (error) {
			reply.code(400).send({ error: error.message });
		}
	}

	async update(request, reply) {
		try {
			const { id } = request.params;
			const factionData = request.body;
			const updated = await factionService.update(id, factionData);
			return updated;
		} catch (error) {
			reply.code(404).send({ error: error.message });
		}
	}

	async delete(request, reply) {
		try {
			const { id } = request.params;
			const deleted = await factionService.delete(id);
			return deleted;
		} catch (error) {
			reply.code(404).send({ error: error.message });
		}
	}
}

module.exports = new FactionHandler();