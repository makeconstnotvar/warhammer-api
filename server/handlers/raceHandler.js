const raceService = require('../services/raceService');

const raceHandler =  {
	async getAll(req, res, next) {
		try {
			const races = await raceService.getAll();
			res.json(races);
		} catch (error) {
			next(error);
		}
	},

	async getById(req, res, next) {
		try {
			const { id } = req.params;
			const race = await raceService.getById(id);
			if (!race) {
				res.status(404).json({ error: 'Race not found' });
			} else {
				res.json(race);
			}
		} catch (error) {
			next(error);
		}
	},

	async create(req, res, next) {
		try {
			const raceData = req.body;
			const race = await raceService.create(raceData);
			res.status(201).json(race);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	},

	async update(req, res, next) {
		try {
			const { id } = req.params;
			const raceData = req.body;
			const updated = await raceService.update(id, raceData);
			if (!updated) {
				res.status(404).json({ error: 'Race not found' });
			} else {
				res.json(updated);
			}
		} catch (error) {
			next(error);
		}
	},

	async delete(req, res, next) {
		try {
			const { id } = req.params;
			const deleted = await raceService.delete(id);
			if (!deleted) {
				res.status(404).json({ error: 'Race not found' });
			} else {
				res.json(deleted);
			}
		} catch (error) {
			next(error);
		}
	}

}

module.exports = {raceHandler};