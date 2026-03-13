const factionRepository = require("../repositories/factionRepository");
const { createLegacyNotFoundError } = require("../lib/legacyApi");

class FactionService {
  async getAll(options = {}) {
    return await factionRepository.findAll(options);
  }

  async getById(id) {
    const faction = await factionRepository.findById(id);
    if (!faction) {
      throw createLegacyNotFoundError("Faction");
    }
    return faction;
  }

  async create(factionData) {
    return await factionRepository.create(factionData);
  }

  async update(id, factionData) {
    const updated = await factionRepository.update(id, factionData);
    if (!updated) {
      throw createLegacyNotFoundError("Faction");
    }
    return updated;
  }

  async delete(id) {
    const deleted = await factionRepository.delete(id);
    if (!deleted) {
      throw createLegacyNotFoundError("Faction");
    }
    return deleted;
  }
}

module.exports = new FactionService();
