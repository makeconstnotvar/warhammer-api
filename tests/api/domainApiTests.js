const assert = require('node:assert/strict');
const { getJson, runTestCases } = require('./testUtils');

async function runDomainApiTests(baseUrl) {
  const cases = [
    {
      name: 'star-systems list returns planets and era includes',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/star-systems?include=planets,era&sort=name');

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, 'star-systems');
        assert.equal(json.meta.total, 6);
        assert.equal(json.data[0].name, 'Armageddon System');
        assert.deepEqual(Object.keys(json.included).sort(), ['eras', 'planets']);
        assert.ok(json.data.some((item) => item.slug === 'sol-system' && item.planetIds.length === 2));
      },
    },
    {
      name: 'battlefields can be filtered by campaign with rich includes',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/battlefields?filter[campaigns]=plague-wars&include=planet,starSystem,factions,characters,campaigns&sort=-intensityLevel,name');

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, 'battlefields');
        assert.equal(json.meta.total, 1);
        assert.equal(json.data[0].slug, 'hesperon-void-line');
        assert.equal(json.data[0].starSystemId, 3);
        assert.deepEqual(Object.keys(json.included).sort(), ['campaigns', 'characters', 'factions', 'planets', 'star-systems']);
      },
    },
    {
      name: 'campaign detail can include linked battlefields',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/campaigns/plague-wars?include=planets,battlefields');

        assert.equal(response.status, 200);
        assert.equal(json.data.slug, 'plague-wars');
        assert.ok(Array.isArray(json.data.battlefieldIds));
        assert.equal(json.data.battlefieldIds.length, 1);
        assert.equal(json.included.battlefields[0].slug, 'hesperon-void-line');
      },
    },
    {
      name: 'explore/path can go directly from campaign to battlefield',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/explore/path?fromResource=campaigns&fromIdentifier=plague-wars&toResource=battlefields&toIdentifier=hesperon-void-line&maxDepth=2&limitPerRelation=6&backlinks=true');

        assert.equal(response.status, 200);
        assert.equal(json.data.found, true);
        assert.equal(json.data.path.length, 1);
        assert.deepEqual(json.data.path.nodes.map((node) => node.slug), ['plague-wars', 'hesperon-void-line']);
      },
    },
  ];

  return runTestCases(cases);
}

module.exports = {
  runDomainApiTests,
};
