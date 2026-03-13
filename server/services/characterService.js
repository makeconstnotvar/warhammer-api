const characterRepository = require("../repositories/characterRepository");
const { createLegacyNotFoundError } = require("../lib/legacyApi");

class CharacterService {
  async getAll(options = {}) {
    return await characterRepository.findAll(options);
  }

  async getById(id) {
    const character = await characterRepository.findById(id);
    if (!character) {
      throw createLegacyNotFoundError("Character");
    }
    return character;
  }

  async create(characterData) {
    return await characterRepository.create(characterData);
  }

  async update(id, characterData) {
    const updated = await characterRepository.update(id, characterData);
    if (!updated) {
      throw createLegacyNotFoundError("Character");
    }
    return updated;
  }

  async delete(id) {
    const deleted = await characterRepository.delete(id);
    if (!deleted) {
      throw createLegacyNotFoundError("Character");
    }
    return deleted;
  }
}

module.exports = new CharacterService();
