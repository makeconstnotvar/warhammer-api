const characterService = require('../services/characterService');
const Character = require('../models/characterModel');

class CharacterHandler {
	async getAll(request, reply) {
		try {
			const characters = await characterService.getAll();
			return characters; // В Fastify можно просто вернуть данные
		} catch (error) {
			reply.code(500).send({ error: error.message });
		}
	}

	async getById(request, reply) {
		try {
			const { id } = request.params;
			const character = await characterService.getById(id);
			return character;
		} catch (error) {
			reply.code(404).send({ error: error.message });
		}
	}

	async create(request, reply) {
		try {
			const characterData = request.body;
			const character = await characterService.create(characterData);
			reply.code(201);
			return character;
		} catch (error) {
			reply.code(400).send({ error: error.message });
		}
	}

	async update(request, reply) {
		try {
			const { id } = request.params;
			const characterData = request.body;
			const updated = await characterService.update(id, characterData);
			return updated;
		} catch (error) {
			reply.code(404).send({ error: error.message });
		}
	}

	async delete(request, reply) {
		try {
			const { id } = request.params;
			const deleted = await characterService.delete(id);
			return deleted;
		} catch (error) {
			reply.code(404).send({ error: error.message });
		}
	}
}

module.exports = new CharacterHandler();