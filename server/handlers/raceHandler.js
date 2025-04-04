const raceService = require('../services/raceService');

const raceHandler = {
	async getAll(req, res, next) {
		try {
			// Извлекаем параметры пагинации и фильтрации из запроса
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 20;

			// Собираем фильтры из query параметров
			const filters = {};
			if (req.query.name) filters.name = req.query.name;

			// Получаем данные с учетом пагинации и фильтрации
			const result = await raceService.getAll({ page, limit, filters });
			res.json(result); // Возвращаем { data, total }
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

module.exports = { raceHandler };