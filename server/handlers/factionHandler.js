const factionService = require('../services/factionService');

const factionHandler = {
	async getAll(req, res, next) {
		try {
			const factions = await factionService.getAll();
			res.json(factions);
		} catch (error) {
			next(error);
		}
	},

	async getById(req, res, next) {
		try {
			const { id } = req.params;
			const faction = await factionService.getById(id);
			if (!faction) {
				res.status(404).json({ error: 'Faction not found' });
			} else {
				res.json(faction);
			}
		} catch (error) {
			next(error);
		}
	},

	async create(req, res, next) {
		try {
			const factionData = req.body;
			const faction = await factionService.create(factionData);
			res.status(201).json(faction);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	},

	async update(req, res, next) {
		try {
			const { id } = req.params;
			const factionData = req.body;
			const updated = await factionService.update(id, factionData);
			if (!updated) {
				res.status(404).json({ error: 'Faction not found' });
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
			const deleted = await factionService.delete(id);
			if (!deleted) {
				res.status(404).json({ error: 'Faction not found' });
			} else {
				res.json(deleted);
			}
		} catch (error) {
			next(error);
		}
	}

}

module.exports = {factionHandler};