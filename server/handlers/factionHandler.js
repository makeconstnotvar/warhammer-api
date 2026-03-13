const factionService = require("../services/factionService");
const { parseLegacyId, parseLegacyListQuery, parseLegacyWriteBody } = require("../lib/legacyApi");

const factionHandler = {
  async getAll(req, res, next) {
    try {
      const result = await factionService.getAll(
        parseLegacyListQuery(req.query, [{ source: "name", target: "name", type: "string" }])
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const faction = await factionService.getById(parseLegacyId(req.params.id));
      res.json(faction);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const faction = await factionService.create(
        parseLegacyWriteBody(req.body, {
          numericFields: ["powerLevel", "raceId"],
        })
      );
      res.status(201).json(faction);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await factionService.update(
        parseLegacyId(req.params.id),
        parseLegacyWriteBody(req.body, {
          numericFields: ["powerLevel", "raceId"],
        })
      );
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const deleted = await factionService.delete(parseLegacyId(req.params.id));
      res.json(deleted);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = { factionHandler };
