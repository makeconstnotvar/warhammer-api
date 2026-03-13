const assert = require("node:assert/strict");
const { runTestCases } = require("../api/testUtils");
const { loadClientModule } = require("./loadClientModule");
const { interactiveScenarios } = require("../../server/content/warhammerContent");

const { buildEntityWorkbenchActions, buildStatsRowWorkbenchActions } =
  loadClientModule("lib/workbenchPivots.js");
const { buildResourceDocsPath, buildResourceHeroActions } = loadClientModule("lib/resourceDocs.js");
const { parseWorkbenchScenarios, selectWorkbenchScenarios } = loadClientModule(
  "lib/workbenchScenarios.js"
);

function assertHref(href, pathname, query = {}) {
  const url = new URL(href, "http://localhost");

  assert.equal(url.pathname, pathname);

  Object.entries(query).forEach(([key, value]) => {
    assert.equal(url.searchParams.get(key), value, `${key} mismatch`);
  });

  assert.equal(
    [...url.searchParams.keys()].length,
    Object.keys(query).length,
    "unexpected query param count"
  );
}

async function runWorkbenchPivotTests() {
  return runTestCases([
    {
      name: "workbench pivots build entity detail graph compare and path links",
      run() {
        const actions = buildEntityWorkbenchActions({
          compareScenarios: [
            {
              fields: "id,name,slug",
              ids: "imperium-of-man,black-legion",
              include: "races,leaders",
              resource: "factions",
            },
          ],
          graphScenarios: [
            {
              backlinks: "true",
              depth: "2",
              limitPerRelation: "4",
              resource: "factions",
              resourceFilterKeys: ["campaigns", "characters"],
            },
          ],
          include: "leaders,races",
          item: {
            id: 1,
            name: "Imperium of Man",
            slug: "imperium-of-man",
          },
          pathScenarios: [
            {
              backlinks: "true",
              fromIdentifier: "black-legion",
              fromResource: "factions",
              limitPerRelation: "6",
              maxDepth: "4",
              resourceFilterKeys: ["campaigns", "relics"],
              toIdentifier: "emperors-sword",
              toResource: "relics",
            },
          ],
          resource: "factions",
        });

        assert.deepEqual(
          actions.map((action) => action.label),
          ["Detail", "Graph", "Compare", "Path"]
        );
        assertHref(actions[0].href, "/resources/factions", {
          identifier: "imperium-of-man",
          include: "leaders,races",
          mode: "detail",
        });
        assertHref(actions[1].href, "/explore/graph", {
          backlinks: "true",
          depth: "2",
          identifier: "imperium-of-man",
          limitPerRelation: "4",
          resource: "factions",
          resources: "campaigns,characters",
        });
        assertHref(actions[2].href, "/compare", {
          "fields[factions]": "id,name,slug",
          ids: "imperium-of-man,black-legion",
          include: "races,leaders",
          resource: "factions",
        });
        assertHref(actions[3].href, "/explore/path", {
          backlinks: "true",
          fromIdentifier: "imperium-of-man",
          fromResource: "factions",
          limitPerRelation: "6",
          maxDepth: "4",
          resources: "campaigns,relics",
          toIdentifier: "emperors-sword",
          toResource: "relics",
        });
      },
    },
    {
      name: "stats pivots prepend filtered browse link for grouped resources",
      run() {
        const actions = buildStatsRowWorkbenchActions({
          compareScenarios: [
            {
              ids: "ultramarines,black-legion",
              include: "races,leaders",
              resource: "factions",
            },
          ],
          graphScenarios: [
            {
              backlinks: "true",
              depth: "2",
              limitPerRelation: "4",
              resource: "factions",
              resourceFilterKeys: ["campaigns", "characters"],
            },
          ],
          pathScenarios: [
            {
              backlinks: "true",
              fromIdentifier: "ultramarines",
              fromResource: "factions",
              limitPerRelation: "6",
              maxDepth: "4",
              resourceFilterKeys: ["campaigns"],
              toIdentifier: "plague-wars",
              toResource: "campaigns",
            },
          ],
          row: {
            name: "Ultramarines",
            slug: "ultramarines",
          },
          section: {
            filterKey: "faction",
            groupResource: "factions",
            listResource: "units",
            metricLabel: "units",
          },
        });

        assert.deepEqual(
          actions.map((action) => action.label),
          ["Browse units", "Detail", "Graph", "Compare", "Path"]
        );
        assertHref(actions[0].href, "/resources/units", {
          filterKey: "faction",
          filterValue: "ultramarines",
          mode: "list",
        });
      },
    },
    {
      name: "stats pivots keep only browse link for ungrouped resource sections",
      run() {
        const actions = buildStatsRowWorkbenchActions({
          row: {
            name: "Ultima Segmentum",
            slug: "ultima-segmentum",
          },
          section: {
            filterKey: "segmentum",
            filterValueResolver: (row) => row.name,
            groupResource: "",
            listResource: "star-systems",
            metricLabel: "systems",
          },
        });

        assert.deepEqual(
          actions.map((action) => action.label),
          ["Browse systems"]
        );
        assertHref(actions[0].href, "/resources/star-systems", {
          filterKey: "segmentum",
          filterValue: "Ultima Segmentum",
          mode: "list",
        });
      },
    },
    {
      name: "resource docs path keeps list and detail deep links stable",
      run() {
        assertHref(
          buildResourceDocsPath("characters", {
            fields: "id,name,slug",
            filterKey: "faction",
            filterValue: "ultramarines",
            identifier: "",
            include: "faction,race",
            limit: "6",
            mode: "list",
            page: "2",
            search: "guilliman",
            sort: "-powerLevel,name",
          }),
          "/resources/characters",
          {
            "fields[characters]": "id,name,slug",
            filterKey: "faction",
            filterValue: "ultramarines",
            include: "faction,race",
            limit: "6",
            mode: "list",
            page: "2",
            search: "guilliman",
            sort: "-powerLevel,name",
          }
        );
        assertHref(
          buildResourceDocsPath("characters", {
            fields: "",
            filterKey: "",
            filterValue: "",
            identifier: "roboute-guilliman",
            include: "faction,race,events",
            limit: "",
            mode: "detail",
            page: "",
            search: "",
            sort: "",
          }),
          "/resources/characters",
          {
            identifier: "roboute-guilliman",
            include: "faction,race,events",
            mode: "detail",
          }
        );
      },
    },
    {
      name: "resource hero actions compose list detail and related workbench links",
      run() {
        const actions = buildResourceHeroActions({
          detailPreviewQuery: {
            fields: "",
            filterKey: "",
            filterValue: "",
            identifier: "roboute-guilliman",
            include: "faction,race,events",
            limit: "",
            mode: "detail",
            page: "",
            search: "",
            sort: "",
          },
          listPreviewQuery: {
            fields: "",
            filterKey: "faction",
            filterValue: "ultramarines",
            identifier: "",
            include: "faction,race",
            limit: "5",
            mode: "list",
            page: "1",
            search: "",
            sort: "-powerLevel,name",
          },
          relatedScenario: {
            docsPath: "/compare?resource=characters&ids=roboute-guilliman,abaddon-the-despoiler",
            groupLabel: "Compare",
            label: "Персонажи",
          },
          resource: "characters",
        });

        assert.deepEqual(
          actions.map((action) => action.label),
          ["Открыть list preview", "Открыть detail sample", "Compare: Персонажи"]
        );
        assertHref(actions[0].href, "/resources/characters", {
          filterKey: "faction",
          filterValue: "ultramarines",
          include: "faction,race",
          limit: "5",
          mode: "list",
          page: "1",
          sort: "-powerLevel,name",
        });
        assertHref(actions[1].href, "/resources/characters", {
          identifier: "roboute-guilliman",
          include: "faction,race,events",
          mode: "detail",
        });
        assertHref(actions[2].href, "/compare", {
          ids: "roboute-guilliman,abaddon-the-despoiler",
          resource: "characters",
        });
      },
    },
    {
      name: "workbench scenario selection respects featured groups resources tags and limits",
      run() {
        const scenarios = parseWorkbenchScenarios({
          data: interactiveScenarios,
        });
        const selected = selectWorkbenchScenarios(scenarios, {
          featuredOnly: true,
          groupLimit: 1,
          groups: ["compare", "graph", "path"],
          limit: 3,
          resources: ["characters"],
          tags: ["starter"],
        });

        assert.equal(selected.length, 3);
        assert.ok(selected.every((scenario) => scenario.featured));
        assert.ok(selected.every((scenario) => scenario.tags.includes("starter")));
        assert.deepEqual(
          selected.map((scenario) => scenario.groupKey),
          ["compare", "graph", "path"]
        );
        assert.ok(selected.every((scenario) => scenario.relatedResources.includes("characters")));
      },
    },
  ]);
}

module.exports = {
  runWorkbenchPivotTests,
};
