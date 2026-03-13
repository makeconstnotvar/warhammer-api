const assert = require("node:assert/strict");
const { getJson, runTestCases } = require("./testUtils");

async function runLegacyApiTests(baseUrl) {
  const cases = [
    {
      name: "legacy character detail returns 404 instead of generic 500 for missing records",
      run: async () => {
        const { json, response } = await getJson(baseUrl, "/api/characters/999999");

        assert.equal(response.status, 404);
        assert.equal(json.error, "Character not found");
      },
    },
    {
      name: "legacy handlers validate invalid path ids",
      run: async () => {
        const { json, response } = await getJson(baseUrl, "/api/factions/not-a-number");

        assert.equal(response.status, 400);
        assert.equal(json.error, "Invalid request parameters");
        assert.ok(
          json.details.some(
            (detail) => detail.field === "id" && detail.code === "INVALID_POSITIVE_INTEGER"
          )
        );
      },
    },
    {
      name: "legacy list endpoints reject invalid pagination and filter ids",
      run: async () => {
        const { json, response } = await getJson(
          baseUrl,
          "/api/characters?page=0&limit=0&faction_id=abc&race_id=-5"
        );

        assert.equal(response.status, 400);
        assert.equal(json.error, "Invalid request parameters");
        assert.ok(json.details.some((detail) => detail.field === "page"));
        assert.ok(json.details.some((detail) => detail.field === "limit"));
        assert.ok(json.details.some((detail) => detail.field === "faction_id"));
        assert.ok(json.details.some((detail) => detail.field === "race_id"));
      },
    },
    {
      name: "legacy create validates payload before reaching postgres",
      run: async () => {
        const response = await fetch(`${baseUrl}/api/races`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({}),
        });
        const json = await response.json();

        assert.equal(response.status, 400);
        assert.equal(json.error, "Invalid request payload");
        assert.ok(
          json.details.some((detail) => detail.field === "name" && detail.code === "REQUIRED")
        );
      },
    },
    {
      name: "legacy update returns 404 for missing records with validated payload",
      run: async () => {
        const response = await fetch(`${baseUrl}/api/characters/999999`, {
          method: "PUT",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            name: "Missing Character",
            powerLevel: 10,
          }),
        });
        const json = await response.json();

        assert.equal(response.status, 404);
        assert.equal(json.error, "Character not found");
      },
    },
  ];

  return runTestCases(cases);
}

module.exports = {
  runLegacyApiTests,
};
