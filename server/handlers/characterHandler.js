const characterService = require('../services/characterService');

const characterHandler = {
	async getAll(req, res, next) {
		try {
			// Извлекаем параметры пагинации и фильтрации из запроса
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 20;

			// Собираем фильтры из query параметров
			const filters = {};
			if (req.query.name) filters.name = req.query.name;
			if (req.query.faction_id) filters.factionId = parseInt(req.query.faction_id);
			if (req.query.race_id) filters.raceId = parseInt(req.query.race_id);

			// Получаем данные с учетом пагинации и фильтрации
			const result = await characterService.getAll({ page, limit, filters });
			res.json(result); // Возвращаем { data, total }
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

module.exports = { characterHandler };