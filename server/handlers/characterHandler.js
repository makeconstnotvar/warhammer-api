const characterService = require('../services/characterService');

const characterHandler = {
	async getAll(req, res, next) {
		try {
			const characters = await characterService.getAll();
			res.json(characters);
		} catch (error) {
			next(error);
		}
	},

	async getById(req, res, next) {
		try {
			const { id } = req.params;
			const character = await characterService.getById(id);
			res.json(character);
		} catch (error) {
			next(error);
		}
	},

	async create(req, res, next) {
		try {
			const characterData = req.body;
			const character = await characterService.create(characterData);
			res.status(201).json(character);
		} catch (error) {
			next(error);
		}
	},

	async update(req, res, next) {
		try {
			const { id } = req.params;
			const characterData = req.body;
			const updated = await characterService.update(id, characterData);
			res.json(updated);
		} catch (error) {
			next(error);
		}
	},

	async delete(req, res, next) {
		try {
			const { id } = req.params;
			const deleted = await characterService.delete(id);
			res.json(deleted);
		} catch (error) {
			next(error);
		}
	}
}

module.exports = {characterHandler};