const db = require('../db');
const Faction = require('../models/factionModel');

class FactionRepository {
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
			SELECT * FROM factions 
			${whereClause}
			ORDER BY name
			LIMIT $${filterIndex} OFFSET $${filterIndex + 1}
		`;

		// Запрос для получения общего количества записей
		const countQuery = `
			SELECT COUNT(*) as total FROM factions 
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
			data: dataResult.rows.map(row => new Faction(row)),
			total: parseInt(countResult.rows[0].total)
		};
	}

	async findById(id) {
		const result = await db.query('SELECT * FROM factions WHERE id = $1', [id]);
		if (result.rows.length === 0) {
			return null;
		}
		return new Faction(result.rows[0]);
	}

	async create(faction) {
		const result = await db.query(
			'INSERT INTO factions (name, description, image_url) VALUES ($1, $2, $3) RETURNING *',
			[faction.name, faction.description, faction.imageUrl]
		);
		return new Faction(result.rows[0]);
	}

	async update(id, faction) {
		const result = await db.query(
			'UPDATE factions SET name = $1, description = $2, image_url = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
			[faction.name, faction.description, faction.imageUrl, id]
		);
		if (result.rows.length === 0) {
			return null;
		}
		return new Faction(result.rows[0]);
	}

	async delete(id) {
		const result = await db.query('DELETE FROM factions WHERE id = $1 RETURNING *', [id]);
		if (result.rows.length === 0) {
			return null;
		}
		return new Faction(result.rows[0]);
	}
}

module.exports = new FactionRepository();