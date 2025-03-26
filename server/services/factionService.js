const factionRepository = require('../repositories/factionRepository');

class FactionService {
	async getAll() {
		return await factionRepository.findAll();
	}

	async getById(id) {
		const faction = await factionRepository.findById(id);
		if (!faction) {
			throw new Error('Faction not found');
		}
		return faction;
	}

	async create(factionData) {
		return await factionRepository.create(factionData);
	}

	async update(id, factionData) {
		const updated = await factionRepository.update(id, factionData);
		if (!updated) {
			throw new Error('Faction not found');
		}
		return updated;
	}

	async delete(id) {
		const deleted = await factionRepository.delete(id);
		if (!deleted) {
			throw new Error('Faction not found');
		}
		return deleted;
	}
}

module.exports = new FactionService();