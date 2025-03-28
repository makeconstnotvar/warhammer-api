const db = require('../db');
const Race = require('../models/raceModel');

class RaceRepository {
	async findAll() {
		const result = await db.query('SELECT * FROM races ORDER BY name');
		return result.rows.map(row => new Race(row));
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