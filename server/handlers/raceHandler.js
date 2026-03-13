const raceService = require("../services/raceService");
const { parseLegacyId, parseLegacyListQuery, parseLegacyWriteBody } = require("../lib/legacyApi");

const raceHandler = {
  async getAll(req, res, next) {
    try {
      const result = await raceService.getAll(
        parseLegacyListQuery(req.query, [{ source: "name", target: "name", type: "string" }])
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const race = await raceService.getById(parseLegacyId(req.params.id));
      res.json(race);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const race = await raceService.create(parseLegacyWriteBody(req.body));
      res.status(201).json(race);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await raceService.update(
        parseLegacyId(req.params.id),
        parseLegacyWriteBody(req.body)
      );
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const deleted = await raceService.delete(parseLegacyId(req.params.id));
      res.json(deleted);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = { raceHandler };
