const assert = require('node:assert/strict');

async function getJson(baseUrl, pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const json = await response.json();
  return { json, response };
}

async function runExploreApiTests(baseUrl) {
  const cases = [
    {
      name: 'explore/graph returns relation graph for faction root',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/explore/graph?resource=factions&identifier=imperium-of-man&depth=2&limitPerRelation=4');

        assert.equal(response.status, 200);
        assert.equal(json.data.root.name, 'Imperium of Man');
        assert.ok(json.meta.nodeCount >= 10);
        assert.ok(json.meta.edgeCount >= 10);
        assert.ok(json.meta.resourceTypes.includes('factions'));
        assert.ok(json.meta.resourceTypes.includes('characters'));
        assert.ok(json.data.nodes.some((node) => node.resource === 'campaigns'));
      },
    },
    {
      name: 'explore/graph resource whitelist keeps only requested types plus root',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/explore/graph?resource=factions&identifier=imperium-of-man&depth=2&limitPerRelation=4&resources=campaigns,characters');

        assert.equal(response.status, 200);
        assert.deepEqual(json.meta.requestedResourceTypes, ['campaigns', 'characters']);
        assert.deepEqual([...json.meta.resourceTypes].sort(), ['campaigns', 'characters', 'factions']);
        assert.ok(json.data.nodes.every((node) => ['campaigns', 'characters', 'factions'].includes(node.resource)));
        assert.equal(json.data.root.resource, 'factions');
      },
    },
    {
      name: 'explore/graph validates missing identifier',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/explore/graph?resource=factions&depth=2');

        assert.equal(response.status, 400);
        assert.equal(json.error.code, 'VALIDATION_ERROR');
      },
    },
    {
      name: 'explore/path finds shortest path through allowed faction relation',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/explore/path?fromResource=relics&fromIdentifier=emperors-sword&toResource=campaigns&toIdentifier=plague-wars&maxDepth=4&limitPerRelation=6&backlinks=true&resources=factions');

        assert.equal(response.status, 200);
        assert.equal(json.data.found, true);
        assert.equal(json.data.path.length, 2);
        assert.deepEqual(json.meta.requestedResourceTypes, ['factions']);
        assert.deepEqual(json.data.path.nodes.map((node) => node.name), ['Emperor\'s Sword', 'Imperium of Man', 'Plague Wars']);
        assert.deepEqual([...json.meta.resourceTypes].sort(), ['campaigns', 'factions', 'relics']);
      },
    },
    {
      name: 'explore/path returns not found when whitelist blocks required traversal',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/explore/path?fromResource=relics&fromIdentifier=emperors-sword&toResource=campaigns&toIdentifier=plague-wars&maxDepth=4&limitPerRelation=6&backlinks=true&resources=organizations');

        assert.equal(response.status, 200);
        assert.equal(json.data.found, false);
        assert.equal(json.data.path.length, 0);
        assert.equal(json.meta.visitedNodeCount, 1);
      },
    },
    {
      name: 'explore/path validates missing identifiers',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/explore/path?fromResource=characters&toResource=relics');

        assert.equal(response.status, 400);
        assert.equal(json.error.code, 'VALIDATION_ERROR');
      },
    },
  ];

  const failures = [];

  for (const testCase of cases) {
    try {
      await testCase.run();
      console.log(`PASS ${testCase.name}`);
    } catch (error) {
      failures.push({ error, name: testCase.name });
      console.error(`FAIL ${testCase.name}`);
      console.error(error.stack || error.message || error);
    }
  }

  return failures;
}

module.exports = {
  runExploreApiTests,
};
