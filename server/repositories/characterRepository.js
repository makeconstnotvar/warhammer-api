const db = require('../db');
const Character = require('../models/characterModel');
const { slugify } = require('../utils/slugify');

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
		const slug = character.slug || slugify(character.name);
		const summary = character.summary || character.description || '';
		const status = character.status || 'active';
		const alignment = character.alignment || 'unknown';
		const powerLevel = parseInt(character.powerLevel || 0, 10);
		const result = await db.query(
			'INSERT INTO characters (slug, name, summary, description, status, alignment, power_level, faction_id, race_id, homeworld_id, era_id, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
			[
				slug,
				character.name,
				summary,
				character.description || '',
				status,
				alignment,
				powerLevel,
				character.factionId || null,
				character.raceId || null,
				character.homeworldId || null,
				character.eraId || null,
				character.imageUrl || null
			]
		);
		return new Character(result.rows[0]);
	}

	async update(id, character) {
		const slug = character.slug || slugify(character.name);
		const summary = character.summary || character.description || '';
		const status = character.status || 'active';
		const alignment = character.alignment || 'unknown';
		const powerLevel = parseInt(character.powerLevel || 0, 10);
		const result = await db.query(
			'UPDATE characters SET slug = $1, name = $2, summary = $3, description = $4, status = $5, alignment = $6, power_level = $7, faction_id = $8, race_id = $9, homeworld_id = $10, era_id = $11, image_url = $12, updated_at = NOW() WHERE id = $13 RETURNING *',
			[
				slug,
				character.name,
				summary,
				character.description || '',
				status,
				alignment,
				powerLevel,
				character.factionId || null,
				character.raceId || null,
				character.homeworldId || null,
				character.eraId || null,
				character.imageUrl || null,
				id
			]
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
