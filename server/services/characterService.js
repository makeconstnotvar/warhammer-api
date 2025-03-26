const characterRepository = require('../repositories/characterRepository');

class CharacterService {
	async getAll() {
		return await characterRepository.findAll();
	}

	async getById(id) {
		const character = await characterRepository.findById(id);
		if (!character) {
			throw new Error('Character not found');
		}
		return character;
	}

	async create(characterData) {
		return await characterRepository.create(characterData);
	}

	async update(id, characterData) {
		const updated = await characterRepository.update(id, characterData);
		if (!updated) {
			throw new Error('Character not found');
		}
		return updated;
	}

	async delete(id) {
		const deleted = await characterRepository.delete(id);
		if (!deleted) {
			throw new Error('Character not found');
		}
		return deleted;
	}
}

module.exports = new CharacterService();