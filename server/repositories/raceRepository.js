const db = require('../db');
const Race = require('../models/raceModel');

class RaceRepository {
	async findAll(options = {}) {
		const { page = 1, limit = 20, filters = {} } = options;
		const offset = (page - 1) * limit;

		// Строим запрос с учетом фильтров
		let queryParams = [];
		let whereConditions = [];
		let filterIndex = 1;

		// Добавляем условия фильтрации
		if (filters.name) {
			whereConditions.push(`name ILIKE $${filterIndex}`);
			queryParams.push(`%${filters.name}%`);
			filterIndex++;
		}

		// Формируем WHERE часть запроса
		const whereClause = whereConditions.length > 0
			? `WHERE ${whereConditions.join(' AND ')}`
			: '';

		// Запрос для получения данных с пагинацией
		const dataQuery = `
			SELECT * FROM races 
			${whereClause}
			ORDER BY name
			LIMIT $${filterIndex} OFFSET $${filterIndex + 1}
		`;

		// Запрос для получения общего количества записей
		const countQuery = `
			SELECT COUNT(*) as total FROM races 
			${whereClause}
		`;

		// Добавляем параметры пагинации
		queryParams.push(limit, offset);

		// Выполняем оба запроса параллельно для оптимизации
		const [dataResult, countResult] = await Promise.all([
			db.query(dataQuery, queryParams),
			db.query(countQuery, queryParams.slice(0, -2)) // Не включаем параметры LIMIT и OFFSET
		]);

		return {
			data: dataResult.rows.map(row => new Race(row)),
			total: parseInt(countResult.rows[0].total)
		};
	}

	async findById(id) {
		const result = await db.query('SELECT * FROM races WHERE id = $1', [id]);
		if (result.rows.length === 0) {
			return null;
		}
		return new Race(result.rows[0]);
	}

	async create(race) {
		const result = await db.query(
			'INSERT INTO races (name, description, image_url) VALUES ($1, $2, $3) RETURNING *',
			[race.name, race.description, race.imageUrl]
		);
		return new Race(result.rows[0]);
	}

	async update(id, race) {
		const result = await db.query(
			'UPDATE races SET name = $1, description = $2, image_url = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
			[race.name, race.description, race.imageUrl, id]
		);
		if (result.rows.length === 0) {
			return null;
		}
		return new Race(result.rows[0]);
	}

	async delete(id) {
		const result = await db.query('DELETE FROM races WHERE id = $1 RETURNING *', [id]);
		if (result.rows.length === 0) {
			return null;
		}
		return new Race(result.rows[0]);
	}
}

module.exports = new RaceRepository();