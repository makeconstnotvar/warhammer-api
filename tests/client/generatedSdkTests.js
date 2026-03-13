const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { runTestCases } = require("../api/testUtils");

async function loadGeneratedSdkModule() {
  const modulePath = path.resolve(__dirname, "../../sdk/warhammerApiV1Client.mjs");
  return import(pathToFileURL(modulePath).href);
}

async function loadSdkPackageExport() {
  return import("warhammer-api/sdk");
}

async function runGeneratedSdkTests(baseUrl) {
  const sdkModule = await loadGeneratedSdkModule();
  const { WarhammerApiError, createWarhammerApiClient, operations } = sdkModule;
  const rootClient = createWarhammerApiClient({ baseUrl, fetchImpl: fetch });
  const apiBaseClient = createWarhammerApiClient({
    baseUrl: `${baseUrl}/api/v1`,
    fetchImpl: fetch,
  });

  const cases = [
    {
      name: "generated sdk asset is served as local esm module",
      run: async () => {
        const response = await fetch(`${baseUrl}/sdk/warhammerApiV1Client.mjs`);
        const source = await response.text();

        assert.equal(response.status, 200);
        assert.match(
          response.headers.get("content-type") || "",
          /javascript|ecmascript|text\/plain/i
        );
        assert.match(source, /createWarhammerApiClient/);
        assert.match(source, /compareResources/);
      },
    },
    {
      name: "generated sdk type declarations are served as local dts asset",
      run: async () => {
        const response = await fetch(`${baseUrl}/sdk/warhammerApiV1Client.d.ts`);
        const source = await response.text();

        assert.equal(response.status, 200);
        assert.match(
          response.headers.get("content-type") || "",
          /text\/plain|typescript|application\/octet-stream/i
        );
        assert.match(source, /export interface WarhammerApiClient/);
        assert.match(source, /export interface ListResourceOptions/);
        assert.match(source, /export type ListResourceResponseBody/);
      },
    },
    {
      name: "generated sdk can be imported through package export subpath",
      run: async () => {
        const packageSdk = await loadSdkPackageExport();

        assert.equal(typeof packageSdk.createWarhammerApiClient, "function");
        assert.ok(packageSdk.operations.getOverview);
      },
    },
    {
      name: "generated sdk exposes openapi-derived operations metadata",
      run: async () => {
        assert.equal(operations.getOverview.path, "/api/v1/overview");
        assert.equal(operations.listResource.pathParameters[0].name, "resource");
        assert.equal(operations.compareResources.queryParameters[0].name, "ids");
        assert.equal(operations.getExploreGraph.queryParameters[0].name, "resource");
      },
    },
    {
      name: "generated sdk accepts base urls with or without /api/v1 suffix",
      run: async () => {
        const { data, status, url } = await apiBaseClient.getOverview();

        assert.equal(status, 200);
        assert.equal(data.data.api.version, "1.0.0");
        assert.equal(url, `${baseUrl}/api/v1/overview`);
      },
    },
    {
      name: "generated sdk serializes deep object and array query params",
      run: async () => {
        const { data, status, url } = await rootClient.listResource({
          resource: "characters",
          query: {
            fields: { characters: "id,name,slug" },
            filter: { faction: "ultramarines" },
            include: ["faction", "race"],
            limit: 1,
          },
        });

        assert.equal(status, 200);
        assert.match(url, /filter%5Bfaction%5D=ultramarines/);
        assert.match(url, /fields%5Bcharacters%5D=id%2Cname%2Cslug/);
        assert.match(url, /include=faction%2Crace/);
        assert.deepEqual(Object.keys(data.data[0]).sort(), ["id", "name", "slug"]);
        assert.equal(data.meta.appliedFilters.faction, "ultramarines");
      },
    },
    {
      name: "generated sdk can call compare endpoints with comma-joined arrays",
      run: async () => {
        const { data, status, url } = await rootClient.compareResources({
          resource: "factions",
          query: {
            ids: ["imperium-of-man", "black-legion"],
            include: ["races", "leaders"],
          },
        });

        assert.equal(status, 200);
        assert.match(url, /ids=imperium-of-man%2Cblack-legion/);
        assert.match(url, /include=races%2Cleaders/);
        assert.equal(data.data.resource, "factions");
        assert.ok(Array.isArray(data.included.races));
      },
    },
    {
      name: "generated sdk throws WarhammerApiError for validation failures",
      run: async () => {
        await assert.rejects(
          () =>
            rootClient.listResource({
              resource: "characters",
              query: {
                limit: 0,
              },
            }),
          (error) => {
            assert.ok(error instanceof WarhammerApiError);
            assert.equal(error.status, 400);
            assert.equal(error.data.error.code, "VALIDATION_ERROR");
            assert.ok(
              error.data.error.details.some(
                (detail) => detail.field === "limit" && detail.code === "INVALID_POSITIVE_INTEGER"
              )
            );
            return true;
          }
        );
      },
    },
  ];

  return runTestCases(cases);
}

module.exports = {
  runGeneratedSdkTests,
};
