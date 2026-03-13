const characterService = require("../services/characterService");
const { parseLegacyId, parseLegacyListQuery, parseLegacyWriteBody } = require("../lib/legacyApi");

const characterHandler = {
  async getAll(req, res, next) {
    try {
      const result = await characterService.getAll(
        parseLegacyListQuery(req.query, [
          { source: "name", target: "name", type: "string" },
          { source: "faction_id", target: "factionId", type: "positiveInt" },
          { source: "race_id", target: "raceId", type: "positiveInt" },
        ])
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const character = await characterService.getById(parseLegacyId(req.params.id));
      res.json(character);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const character = await characterService.create(
        parseLegacyWriteBody(req.body, {
          numericFields: ["powerLevel", "factionId", "raceId", "homeworldId", "eraId"],
        })
      );
      res.status(201).json(character);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await characterService.update(
        parseLegacyId(req.params.id),
        parseLegacyWriteBody(req.body, {
          numericFields: ["powerLevel", "factionId", "raceId", "homeworldId", "eraId"],
        })
      );
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const deleted = await characterService.delete(parseLegacyId(req.params.id));
      res.json(deleted);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = { characterHandler };
