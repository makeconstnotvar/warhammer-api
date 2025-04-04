const db = require('../db');
const Character = require('../models/characterModel');

class CharacterRepository {
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

		if (filters.factionId) {
			whereConditions.push(`faction_id = $${filterIndex}`);
			queryParams.push(filters.factionId);
			filterIndex++;
		}

		if (filters.raceId) {
			whereConditions.push(`race_id = $${filterIndex}`);
			queryParams.push(filters.raceId);
			filterIndex++;
		}

		// Формируем WHERE часть запроса
		const whereClause = whereConditions.length > 0
			? `WHERE ${whereConditions.join(' AND ')}`
			: '';

		// Запрос для получения данных с пагинацией
		const dataQuery = `
			SELECT * FROM characters 
			${whereClause}
			ORDER BY name
			LIMIT $${filterIndex} OFFSET $${filterIndex + 1}
		`;

		// Запрос для получения общего количества записей
		const countQuery = `
			SELECT COUNT(*) as total FROM characters 
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
			data: dataResult.rows.map(row => new Character(row)),
			total: parseInt(countResult.rows[0].total)
		};
	}

	async findById(id) {
		const result = await db.query('SELECT * FROM characters WHERE id = $1', [id]);
		if (result.rows.length === 0) {
			return null;
		}
		return new Character(result.rows[0]);
	}

	async create(character) {
		const result = await db.query(
			'INSERT INTO characters (name, description, faction_id, race_id, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
			[character.name, character.description, character.factionId, character.raceId, character.imageUrl]
		);
		return new Character(result.rows[0]);
	}

	async update(id, character) {
		const result = await db.query(
			'UPDATE characters SET name = $1, description = $2, faction_id = $3, race_id = $4, image_url = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
			[character.name, character.description, character.factionId, character.raceId, character.imageUrl, id]
		);
		if (result.rows.length === 0) {
			return null;
		}
		return new Character(result.rows[0]);
	}

	async delete(id) {
		const result = await db.query('DELETE FROM characters WHERE id = $1 RETURNING *', [id]);
		if (result.rows.length === 0) {
			return null;
		}
		return new Character(result.rows[0]);
	}
}

module.exports = new CharacterRepository();