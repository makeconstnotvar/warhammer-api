const express = require('express');
const contentApi = require('./content/contentApi');
const { createApiError } = require('./lib/apiErrors');

const apiV1Routes = express.Router();

apiV1Routes.get('/', async (req, res, next) => {
  try {
    res.json(await contentApi.getOverview());
  } catch (error) {
    next(error);
  }
});

apiV1Routes.get('/overview', async (req, res, next) => {
  try {
    res.json(await contentApi.getOverview());
  } catch (error) {
    next(error);
  }
});

apiV1Routes.get('/catalog/resources', async (req, res, next) => {
  try {
    res.json(await contentApi.getResourceCatalog());
  } catch (error) {
    next(error);
  }
});

apiV1Routes.get('/catalog/resources/:resource', async (req, res, next) => {
  try {
    res.json(await contentApi.getResourceDocumentation(req.params.resource));
  } catch (error) {
    next(error);
  }
});

apiV1Routes.get('/query-guide', (req, res) => {
  res.json(contentApi.getQueryGuide());
});

apiV1Routes.get('/examples/concurrency', (req, res) => {
  res.json(contentApi.getConcurrencyExample());
});

apiV1Routes.get('/search', async (req, res, next) => {
  try {
    res.json(await contentApi.searchAll(req.query, req.baseUrl + req.path));
  } catch (error) {
    next(error);
  }
});

apiV1Routes.get('/random/:resource', async (req, res, next) => {
  try {
    res.json(await contentApi.getRandomResource(req.params.resource, req.query));
  } catch (error) {
    next(error);
  }
});

apiV1Routes.get('/compare/:resource', async (req, res, next) => {
  try {
    res.json(await contentApi.compareResources(req.params.resource, req.query));
  } catch (error) {
    next(error);
  }
});

apiV1Routes.get('/stats/:resource/:groupKey', async (req, res, next) => {
  try {
    res.json(await contentApi.getStats(req.params.resource, req.params.groupKey));
  } catch (error) {
    next(error);
  }
});

apiV1Routes.get('/explore/graph', async (req, res, next) => {
  try {
    res.json(await contentApi.getExploreGraph(req.query));
  } catch (error) {
    next(error);
  }
});

apiV1Routes.get('/explore/path', async (req, res, next) => {
  try {
    res.json(await contentApi.getExplorePath(req.query));
  } catch (error) {
    next(error);
  }
});

apiV1Routes.get('/:resource/:idOrSlug', async (req, res, next) => {
  try {
    res.json(await contentApi.getResourceDetail(req.params.resource, req.params.idOrSlug, req.query));
  } catch (error) {
    next(error);
  }
});

apiV1Routes.get('/:resource', async (req, res, next) => {
  try {
    res.json(await contentApi.listResource(req.params.resource, req.query, req.baseUrl + req.path));
  } catch (error) {
    next(error);
  }
});

apiV1Routes.use((req, res, next) => {
  next(createApiError(404, 'ENDPOINT_NOT_FOUND', `Unknown endpoint "${req.originalUrl}"`));
});

module.exports = {
  apiV1Routes,
};
