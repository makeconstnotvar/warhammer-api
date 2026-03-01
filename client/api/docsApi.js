import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
});

async function unwrap(request) {
  const response = await request;
  return response.data;
}

const docsApi = {
  getOverview: () => unwrap(client.get('/overview')),
  getCatalog: () => unwrap(client.get('/catalog/resources')),
  getResourceDoc: (resource) => unwrap(client.get(`/catalog/resources/${resource}`)),
  getResourceList: (resource, params = {}) => unwrap(client.get(`/${resource}`, { params })),
  getResourceDetail: (resource, idOrSlug, params = {}) => unwrap(client.get(`/${resource}/${idOrSlug}`, { params })),
  getQueryGuide: () => unwrap(client.get('/query-guide')),
  getConcurrencyExample: () => unwrap(client.get('/examples/concurrency')),
  getCompare: (resource, params = {}) => unwrap(client.get(`/compare/${resource}`, { params })),
  getGraph: (params = {}) => unwrap(client.get('/explore/graph', { params })),
  getPath: (params = {}) => unwrap(client.get('/explore/path', { params })),
  getStats: (resource, groupKey) => unwrap(client.get(`/stats/${resource}/${groupKey}`)),
  search: (params = {}) => unwrap(client.get('/search', { params })),
};

export { docsApi };
