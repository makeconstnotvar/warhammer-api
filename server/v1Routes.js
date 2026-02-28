const express = require('express');
const contentApi = require('./content/contentApi');
const { createApiError } = require('./lib/apiErrors');

const apiV1Routes = express.Router();

apiV1Routes.get('/', (req, res) => {
  res.json(contentApi.getOverview());
});

apiV1Routes.get('/overview', (req, res) => {
  res.json(contentApi.getOverview());
});

apiV1Routes.get('/catalog/resources', (req, res) => {
  res.json(contentApi.getResourceCatalog());
});

apiV1Routes.get('/catalog/resources/:resource', (req, res, next) => {
  try {
    res.json(contentApi.getResourceDocumentation(req.params.resource));
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

apiV1Routes.get('/search', (req, res, next) => {
  try {
    res.json(contentApi.searchAll(req.query, req.baseUrl + req.path));
  } catch (error) {
    next(error);
  }
});

apiV1Routes.get('/:resource/:idOrSlug', (req, res, next) => {
  try {
    res.json(contentApi.getResourceDetail(req.params.resource, req.params.idOrSlug, req.query));
  } catch (error) {
    next(error);
  }
});

apiV1Routes.get('/:resource', (req, res, next) => {
  try {
    res.json(contentApi.listResource(req.params.resource, req.query, req.baseUrl + req.path));
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
