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
      name: 'fleets list returns commanders campaigns and star-system includes',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/fleets?include=factions,commanders,campaigns,currentStarSystem,homePort&sort=-strengthRating,name');

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, 'fleets');
        assert.equal(json.meta.total, 5);
        assert.equal(json.data[0].slug, 'indomitus-battlegroup');
        assert.equal(json.data[0].currentStarSystemId, 3);
        assert.deepEqual(Object.keys(json.included).sort(), ['campaigns', 'characters', 'factions', 'planets', 'star-systems']);
      },
    },
    {
      name: 'warp-routes can be filtered by star systems with route includes',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/warp-routes?filter[starSystems]=sol-system,baal-system&include=fromStarSystem,toStarSystem,factions,campaigns&sort=-stabilityLevel,name');

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, 'warp-routes');
        assert.equal(json.meta.total, 4);
        assert.equal(json.data[0].slug, 'sol-macragge-corridor');
        assert.ok(json.data.some((item) => item.slug === 'cadian-breach-lane'));
        assert.deepEqual(Object.keys(json.included).sort(), ['campaigns', 'factions', 'star-systems']);
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
    {
      name: 'explore/path can connect fleet to battlefield through campaign graph',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/explore/path?fromResource=fleets&fromIdentifier=indomitus-battlegroup&toResource=battlefields&toIdentifier=hesperon-void-line&maxDepth=3&limitPerRelation=6&backlinks=true&resources=campaigns,battlefields');

        assert.equal(response.status, 200);
        assert.equal(json.data.found, true);
        assert.deepEqual(json.data.path.nodes.map((node) => node.slug), ['indomitus-battlegroup', 'plague-wars', 'hesperon-void-line']);
      },
    },
  ];

  return runTestCases(cases);
}

module.exports = {
  runDomainApiTests,
};
