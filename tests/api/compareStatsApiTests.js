const assert = require('node:assert/strict');
const { getJson, runTestCases } = require('./testUtils');

async function runCompareStatsApiTests(baseUrl) {
  const cases = [
    {
      name: 'compare/factions returns included relations and stable power comparison',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/compare/factions?ids=imperium-of-man,black-legion&include=races,leaders,homeworld');

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, 'factions');
        assert.equal(json.meta.count, 2);
        assert.deepEqual(json.data.items.map((item) => item.name), ['Imperium of Man', 'Black Legion']);
        assert.equal(json.data.comparison.powerSpread, 5);
        assert.equal(json.data.comparison.strongest.name, 'Imperium of Man');
        assert.equal(json.data.comparison.weakest.name, 'Black Legion');
        assert.deepEqual(json.data.comparison.sharedRaceIds, [1]);
        assert.deepEqual(Object.keys(json.included).sort(), ['characters', 'planets', 'races']);
      },
    },
    {
      name: 'compare/organizations returns influence comparison and includes',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/compare/organizations?ids=inquisition,adeptus-mechanicus&include=factions,leaders,homeworld,era');

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, 'organizations');
        assert.equal(json.meta.count, 2);
        assert.deepEqual(json.data.items.map((item) => item.name), ['Inquisition', 'Adeptus Mechanicus']);
        assert.equal(json.data.comparison.influenceSpread, 3);
        assert.equal(json.data.comparison.mostInfluential.name, 'Inquisition');
        assert.equal(json.data.comparison.leastInfluential.name, 'Adeptus Mechanicus');
        assert.deepEqual(json.data.comparison.sharedFactionIds, [1]);
        assert.deepEqual(Object.keys(json.included).sort(), ['characters', 'eras', 'factions', 'planets']);
      },
    },
    {
      name: 'compare/star-systems returns stable system spread and includes',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/compare/star-systems?ids=sol-system,macragge-system&include=planets,era');

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, 'star-systems');
        assert.equal(json.meta.count, 2);
        assert.deepEqual(json.data.items.map((item) => item.name), ['Sol System', 'Macragge System']);
        assert.equal(json.data.comparison.planetSpread, 1);
        assert.equal(json.data.comparison.largest.name, 'Sol System');
        assert.equal(json.data.comparison.largest.planetCount, 2);
        assert.equal(json.data.comparison.smallest.name, 'Macragge System');
        assert.deepEqual(json.data.comparison.segmentums.sort(), ['Segmentum Solar', 'Ultima Segmentum']);
        assert.deepEqual(Object.keys(json.included).sort(), ['eras', 'planets']);
      },
    },
    {
      name: 'compare/battlefields returns tactical spread and rich includes',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/compare/battlefields?ids=hesperon-void-line,kasr-partox-ruins&include=planet,starSystem,era,factions,characters,campaigns');

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, 'battlefields');
        assert.equal(json.meta.count, 2);
        assert.deepEqual(json.data.items.map((item) => item.name), ['Hesperon Void Line', 'Kasr Partox Ruins']);
        assert.equal(json.data.comparison.intensitySpread, 2);
        assert.equal(json.data.comparison.mostIntense.name, 'Hesperon Void Line');
        assert.equal(json.data.comparison.leastIntense.name, 'Kasr Partox Ruins');
        assert.deepEqual(json.data.comparison.sharedFactionIds, [1, 3]);
        assert.deepEqual(json.data.comparison.sharedCharacterIds, [4]);
        assert.deepEqual(Object.keys(json.included).sort(), ['campaigns', 'characters', 'eras', 'factions', 'planets', 'star-systems']);
      },
    },
    {
      name: 'compare requires two valid identifiers',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/compare/factions?ids=imperium-of-man');

        assert.equal(response.status, 400);
        assert.equal(json.error.code, 'COMPARE_REQUIRES_TWO_ITEMS');
      },
    },
    {
      name: 'compare returns explicit unsupported error for resources without comparison builder',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/compare/planets?ids=terra,mars');

        assert.equal(response.status, 400);
        assert.equal(json.error.code, 'COMPARE_NOT_SUPPORTED');
      },
    },
    {
      name: 'stats/units/by-faction returns deterministic top aggregates',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/stats/units/by-faction');

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, 'units');
        assert.equal(json.meta.groupBy, 'faction');
        assert.equal(json.meta.total, 10);
        assert.equal(json.data[0].slug, 'ultramarines');
        assert.equal(json.data[0].count, 3);
        assert.equal(json.data[0].averagePowerLevel, 88);
        assert.equal(json.data[0].maxPowerLevel, 92);
      },
    },
    {
      name: 'stats/campaigns/by-organization returns deterministic top aggregates',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/stats/campaigns/by-organization');

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, 'campaigns');
        assert.equal(json.meta.groupBy, 'organization');
        assert.equal(json.meta.total, 10);
        assert.equal(json.data[0].slug, 'inquisition');
        assert.equal(json.data[0].count, 4);
        assert.equal(json.data[0].activeCount, 3);
        assert.equal(json.data[0].latestYearLabel, 'Late M42');
      },
    },
    {
      name: 'stats/battlefields/by-faction returns deterministic top aggregates',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/stats/battlefields/by-faction');

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, 'battlefields');
        assert.equal(json.meta.groupBy, 'faction');
        assert.equal(json.meta.total, 14);
        assert.equal(json.data[0].slug, 'imperium-of-man');
        assert.equal(json.data[0].count, 5);
        assert.equal(json.data[0].averageIntensityLevel, 95);
        assert.equal(json.data[0].maxIntensityLevel, 100);
      },
    },
    {
      name: 'stats/star-systems/by-segmentum returns deterministic segmentum aggregates',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/stats/star-systems/by-segmentum');

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, 'star-systems');
        assert.equal(json.meta.groupBy, 'segmentum');
        assert.equal(json.meta.total, 6);
        assert.equal(json.data[0].slug, 'segmentum-solar');
        assert.equal(json.data[0].count, 2);
        assert.equal(json.data[0].planetCount, 3);
        assert.equal(json.data[0].activeCount, 2);
      },
    },
    {
      name: 'stats returns explicit not found error for unsupported grouping',
      run: async () => {
        const { json, response } = await getJson(baseUrl, '/api/v1/stats/relics/by-era');

        assert.equal(response.status, 404);
        assert.equal(json.error.code, 'STATS_NOT_FOUND');
      },
    },
  ];

  return runTestCases(cases);
}

module.exports = {
  runCompareStatsApiTests,
};
