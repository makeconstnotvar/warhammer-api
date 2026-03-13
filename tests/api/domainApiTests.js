const assert = require("node:assert/strict");
const config = require("../../server/config");
const { getJson, runTestCases } = require("./testUtils");

async function runDomainApiTests(baseUrl) {
  const cases = [
    {
      name: "changelog endpoint returns current lifecycle entry",
      run: async () => {
        const { json, response } = await getJson(baseUrl, "/api/v1/changelog");

        assert.equal(response.status, 200);
        assert.equal(json.meta.currentVersion, "1.0.0");
        assert.equal(json.data.entries.length, 1);
        assert.equal(json.data.entries[0].status, "current");
        assert.ok(
          json.data.entries[0].changes.some(
            (change) => change.type === "changed" && change.area === "legacy api"
          )
        );
      },
    },
    {
      name: "deprecation policy endpoint documents legacy migration targets",
      run: async () => {
        const { json, response } = await getJson(baseUrl, "/api/v1/deprecation-policy");

        assert.equal(response.status, 200);
        assert.equal(json.data.legacyEndpoints.length, 3);
        assert.ok(json.data.headers.some((header) => header.name === "Deprecation"));
        assert.ok(
          json.data.legacyEndpoints.some(
            (endpoint) =>
              endpoint.path === "/api/factions" && endpoint.replacement === "/api/v1/factions"
          )
        );
      },
    },
    {
      name: "openapi endpoint publishes machine-readable contract",
      run: async () => {
        const { json, response } = await getJson(baseUrl, "/api/v1/openapi.json");

        assert.equal(response.status, 200);
        assert.equal(json.openapi, "3.1.0");
        assert.ok(json.paths["/api/v1/openapi.json"]);
        assert.ok(json.paths["/api/v1/compare/{resource}"]);
        assert.ok(json.paths["/api/v1/examples/workbench"]);
        assert.ok(json.paths["/api/v1/{resource}"]);
        assert.ok(
          json.paths["/api/v1/{resource}"].get.parameters[0].schema.enum.includes("factions")
        );
        assert.equal(json.components.parameters.Page.example, 1);
        assert.equal(json.components.parameters.Sort.example, "-powerLevel,name");
        assert.equal(json.components.parameters.Fields.example.characters, "id,name,slug");
        assert.ok(json.components.schemas.FactionsResource);
        assert.ok(json.components.schemas.ValidationErrorResponse);
        assert.ok(json.components.schemas.WorkbenchScenariosResponse);
        assert.ok(json.components.schemas.IncludedResources.properties.factions);
        assert.ok(json.components.schemas.GraphNode.properties.distance);
        assert.equal(
          json.components.schemas.PathResponse.properties.data.properties.path.properties.edges.items.properties.traversal.enum.includes(
            "reverse"
          ),
          true
        );
        assert.ok(Array.isArray(json.components.schemas.StatsResponse.properties.data.items.oneOf));
        const workbenchExample =
          json.paths["/api/v1/examples/workbench"].get.responses["200"].content["application/json"]
            .example;
        assert.equal(
          workbenchExample.data.compare.find((scenario) => scenario.id === "factions").difficulty,
          "starter"
        );
        assert.equal(
          workbenchExample.data.compare.find((scenario) => scenario.id === "factions").featured,
          true
        );
        assert.ok(
          workbenchExample.data.path
            .find((scenario) => scenario.id === "campaign-to-battlefield")
            .tags.includes("whitelist")
        );
        assert.equal(
          json.paths["/api/v1/explore/graph"].get.responses["429"].content["application/json"]
            .example.error.code,
          "RATE_LIMIT_EXCEEDED"
        );
      },
    },
    {
      name: "openapi reference page serves local swagger ui shell",
      run: async () => {
        const response = await fetch(`${baseUrl}/openapi/reference`);
        const html = await response.text();

        assert.equal(response.status, 200);
        assert.match(response.headers.get("content-type") || "", /text\/html/i);
        assert.match(html, /swagger-ui-bundle\.js/);
        assert.match(html, /\/api\/v1\/openapi\.json/);
        assert.match(html, /OpenAPI Reference/i);
      },
    },
    {
      name: "workbench scenarios endpoint groups compare graph and path presets",
      run: async () => {
        const { json, response } = await getJson(baseUrl, "/api/v1/examples/workbench");

        assert.equal(response.status, 200);
        assert.equal(json.meta.total, 23);
        assert.equal(json.meta.groups.compare, 8);
        assert.equal(json.meta.groups.graph, 9);
        assert.equal(json.meta.groups.path, 6);
        assert.ok(
          json.data.compare.some(
            (scenario) =>
              scenario.id === "factions" &&
              scenario.difficulty === "starter" &&
              scenario.featured === true &&
              scenario.path.startsWith("/api/v1/compare/factions") &&
              scenario.pathResources.includes("campaigns") &&
              scenario.pathResources.includes("units") &&
              scenario.tags.includes("starter")
          )
        );
        assert.ok(
          json.data.graph.some(
            (scenario) =>
              scenario.id === "characters" &&
              scenario.featured === true &&
              scenario.tags.includes("backlinks") &&
              scenario.path.includes("/api/v1/explore/graph?resource=characters")
          )
        );
        assert.ok(
          json.data.path.some(
            (scenario) =>
              scenario.id === "hero-to-relic" &&
              scenario.difficulty === "starter" &&
              scenario.tags.includes("relics") &&
              scenario.path.includes("fromResource=characters")
          )
        );
      },
    },
    {
      name: "legacy api responses expose deprecation headers",
      run: async () => {
        const response = await fetch(`${baseUrl}/api/factions`);
        const json = await response.json();

        assert.equal(response.status, 200);
        assert.ok(Array.isArray(json.data));
        assert.equal(response.headers.get("deprecation"), "@1772841600");
        assert.equal(response.headers.get("sunset"), "Wed, 30 Sep 2026 23:59:59 GMT");
        assert.equal(
          response.headers.get("link"),
          '</deprecation-policy>; rel="deprecation"; type="text/html"'
        );
      },
    },
    {
      name: "overview and query guide expose runtime rate limit policy",
      run: async () => {
        const { json: overviewJson, response: overviewResponse } = await getJson(
          baseUrl,
          "/api/v1/overview"
        );
        const { json: guideJson, response: guideResponse } = await getJson(
          baseUrl,
          "/api/v1/query-guide"
        );

        assert.equal(overviewResponse.status, 200);
        assert.equal(guideResponse.status, 200);
        assert.equal(overviewJson.data.api.rateLimit.limit, config.apiV1RateLimit.maxRequests);
        assert.equal(overviewJson.data.interactiveScenarios.compare.length, 8);
        assert.equal(overviewJson.data.interactiveScenarios.graph.length, 9);
        assert.equal(overviewJson.data.interactiveScenarios.path.length, 6);
        assert.ok(
          overviewJson.data.interactiveScenarios.compare.some(
            (scenario) =>
              scenario.id === "characters" &&
              scenario.featured === true &&
              scenario.tags.includes("characters") &&
              scenario.pathResources.includes("relics")
          )
        );
        assert.equal(
          overviewJson.data.api.rateLimit.policy,
          `${config.apiV1RateLimit.maxRequests};w=${Math.max(1, Math.ceil(config.apiV1RateLimit.windowMs / 1000))}`
        );
        assert.equal(guideJson.data.rateLimit.limit, config.apiV1RateLimit.maxRequests);
        assert.ok(
          guideJson.data.rateLimit.headers.some((header) => header.name === "RateLimit-Reset")
        );
        assert.equal(
          guideJson.data.responseShapes.rateLimitError.error.code,
          "RATE_LIMIT_EXCEEDED"
        );
      },
    },
    {
      name: "resource list aggregates validation details for invalid query parameters",
      run: async () => {
        const { json, response } = await getJson(
          baseUrl,
          "/api/v1/characters?limit=0&include=unknown-link&sort=unknownSort&fields[characters]=id,warpValue&fields[unknown]=id"
        );

        assert.equal(response.status, 400);
        assert.equal(json.error.code, "VALIDATION_ERROR");
        assert.ok(
          json.error.details.some(
            (detail) => detail.field === "limit" && detail.code === "INVALID_POSITIVE_INTEGER"
          )
        );
        assert.ok(
          json.error.details.some(
            (detail) =>
              detail.field === "include" &&
              detail.code === "UNKNOWN_INCLUDE" &&
              detail.value === "unknown-link"
          )
        );
        assert.ok(
          json.error.details.some(
            (detail) =>
              detail.field === "sort" &&
              detail.code === "UNKNOWN_SORT_FIELD" &&
              detail.value === "unknownSort"
          )
        );
        assert.ok(
          json.error.details.some(
            (detail) =>
              detail.field === "fields[characters]" &&
              detail.code === "UNKNOWN_FIELD" &&
              detail.value === "warpValue"
          )
        );
        assert.ok(
          json.error.details.some(
            (detail) =>
              detail.field === "fields[unknown]" &&
              detail.code === "UNKNOWN_RESOURCE" &&
              detail.value === "unknown"
          )
        );
      },
    },
    {
      name: "star-systems list returns planets and era includes",
      run: async () => {
        const { json, response } = await getJson(
          baseUrl,
          "/api/v1/star-systems?include=planets,era&sort=name"
        );

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, "star-systems");
        assert.equal(json.meta.total, 6);
        assert.equal(json.data[0].name, "Armageddon System");
        assert.deepEqual(Object.keys(json.included).sort(), ["eras", "planets"]);
        assert.ok(
          json.data.some((item) => item.slug === "sol-system" && item.planetIds.length === 2)
        );
      },
    },
    {
      name: "battlefields can be filtered by campaign with rich includes",
      run: async () => {
        const { json, response } = await getJson(
          baseUrl,
          "/api/v1/battlefields?filter[campaigns]=plague-wars&include=planet,starSystem,factions,characters,campaigns&sort=-intensityLevel,name"
        );

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, "battlefields");
        assert.equal(json.meta.total, 1);
        assert.equal(json.data[0].slug, "hesperon-void-line");
        assert.equal(json.data[0].starSystemId, 3);
        assert.deepEqual(Object.keys(json.included).sort(), [
          "campaigns",
          "characters",
          "factions",
          "planets",
          "star-systems",
        ]);
      },
    },
    {
      name: "fleets list returns commanders campaigns and star-system includes",
      run: async () => {
        const { json, response } = await getJson(
          baseUrl,
          "/api/v1/fleets?include=factions,commanders,campaigns,currentStarSystem,homePort&sort=-strengthRating,name"
        );

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, "fleets");
        assert.equal(json.meta.total, 5);
        assert.equal(json.data[0].slug, "indomitus-battlegroup");
        assert.equal(json.data[0].currentStarSystemId, 3);
        assert.deepEqual(Object.keys(json.included).sort(), [
          "campaigns",
          "characters",
          "factions",
          "planets",
          "star-systems",
        ]);
      },
    },
    {
      name: "warp-routes can be filtered by star systems with route includes",
      run: async () => {
        const { json, response } = await getJson(
          baseUrl,
          "/api/v1/warp-routes?filter[starSystems]=sol-system,baal-system&include=fromStarSystem,toStarSystem,factions,campaigns&sort=-stabilityLevel,name"
        );

        assert.equal(response.status, 200);
        assert.equal(json.meta.resource, "warp-routes");
        assert.equal(json.meta.total, 4);
        assert.equal(json.data[0].slug, "sol-macragge-corridor");
        assert.ok(json.data.some((item) => item.slug === "cadian-breach-lane"));
        assert.deepEqual(Object.keys(json.included).sort(), [
          "campaigns",
          "factions",
          "star-systems",
        ]);
      },
    },
    {
      name: "campaign detail can include linked battlefields",
      run: async () => {
        const { json, response } = await getJson(
          baseUrl,
          "/api/v1/campaigns/plague-wars?include=planets,battlefields"
        );

        assert.equal(response.status, 200);
        assert.equal(json.data.slug, "plague-wars");
        assert.ok(Array.isArray(json.data.battlefieldIds));
        assert.equal(json.data.battlefieldIds.length, 1);
        assert.equal(json.included.battlefields[0].slug, "hesperon-void-line");
      },
    },
    {
      name: "explore/path can go directly from campaign to battlefield",
      run: async () => {
        const { json, response } = await getJson(
          baseUrl,
          "/api/v1/explore/path?fromResource=campaigns&fromIdentifier=plague-wars&toResource=battlefields&toIdentifier=hesperon-void-line&maxDepth=2&limitPerRelation=6&backlinks=true"
        );

        assert.equal(response.status, 200);
        assert.equal(json.data.found, true);
        assert.equal(json.data.path.length, 1);
        assert.deepEqual(
          json.data.path.nodes.map((node) => node.slug),
          ["plague-wars", "hesperon-void-line"]
        );
      },
    },
    {
      name: "explore/path can connect fleet to battlefield through campaign graph",
      run: async () => {
        const { json, response } = await getJson(
          baseUrl,
          "/api/v1/explore/path?fromResource=fleets&fromIdentifier=indomitus-battlegroup&toResource=battlefields&toIdentifier=hesperon-void-line&maxDepth=3&limitPerRelation=6&backlinks=true&resources=campaigns,battlefields"
        );

        assert.equal(response.status, 200);
        assert.equal(json.data.found, true);
        assert.deepEqual(
          json.data.path.nodes.map((node) => node.slug),
          ["indomitus-battlegroup", "plague-wars", "hesperon-void-line"]
        );
      },
    },
  ];

  return runTestCases(cases);
}

module.exports = {
  runDomainApiTests,
};
