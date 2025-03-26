const db = require('../database/db');
const Faction = require('../models/factionModel');

class FactionRepository {
	async findAll() {
		const result = await db.query('SELECT * FROM factions ORDER BY name');
		return result.rows.map(row => new Faction(row));
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