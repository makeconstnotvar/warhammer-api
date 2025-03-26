const raceRepository = require('../repositories/raceRepository');

class RaceService {
	async getAll() {
		return await raceRepository.findAll();
	}

	async getById(id) {
		const race = await raceRepository.findById(id);
		if (!race) {
			throw new Error('Race not found');
		}
		return race;
	}

	async create(raceData) {
		return await raceRepository.create(raceData);
	}

	async update(id, raceData) {
		const updated = await raceRepository.update(id, raceData);
		if (!updated) {
			throw new Error('Race not found');
		}
		return updated;
	}

	async delete(id) {
		const deleted = await raceRepository.delete(id);
		if (!deleted) {
			throw new Error('Race not found');
		}
		return deleted;
	}
}

module.exports = new RaceService();