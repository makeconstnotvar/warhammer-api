const db = require('../db');
const Character = require('../models/characterModel');

class CharacterRepository {
	async findAll() {
		const result = await db.query('SELECT * FROM characters ORDER BY name');
		return result.rows.map(row => new Character(row));
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