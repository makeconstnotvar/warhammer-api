const { deprecationPolicy, legacyApiPolicy } = require("./apiLifecycle");

const sharedDeprecationHeaders = {
  Deprecation: {
    $ref: "#/components/headers/Deprecation",
  },
  Link: {
    $ref: "#/components/headers/Link",
  },
  Sunset: {
    $ref: "#/components/headers/Sunset",
  },
};

const legacyResources = {
  characters: {
    tag: "Characters",
    label: "characters",
    operationBase: "Character",
    replacement: "/api/v1/characters",
    listFilters: ["LegacyNameFilter", "LegacyFactionIdFilter", "LegacyRaceIdFilter"],
    itemSchema: "LegacyCharacterResource",
    writeSchema: "LegacyCharacterWritePayload",
    example: {
      id: 1,
      slug: "roboute-guilliman",
      name: "Roboute Guilliman",
      summary: "Lord Commander of the Imperium and primarch of the Ultramarines.",
      description: "Legacy CRUD representation of Roboute Guilliman with numeric foreign keys.",
      status: "active",
      alignment: "imperium",
      powerLevel: 100,
      factionId: 1,
      raceId: 1,
      homeworldId: 1,
      eraId: 1,
      imageUrl: null,
      createdAt: "2026-03-07T00:00:00.000Z",
      updatedAt: "2026-03-07T00:00:00.000Z",
    },
    writeExample: {
      name: "Roboute Guilliman",
      summary: "Lord Commander of the Imperium.",
      description: "Legacy CRUD payload for a character.",
      status: "active",
      alignment: "imperium",
      powerLevel: 100,
      factionId: 1,
      raceId: 1,
      homeworldId: 1,
      eraId: 1,
      imageUrl: null,
    },
  },
  factions: {
    tag: "Factions",
    label: "factions",
    operationBase: "Faction",
    replacement: "/api/v1/factions",
    listFilters: ["LegacyNameFilter"],
    itemSchema: "LegacyFactionResource",
    writeSchema: "LegacyFactionWritePayload",
    example: {
      id: 1,
      slug: "ultramarines",
      name: "Ultramarines",
      summary: "Codex-adherent Space Marine chapter.",
      description: "Legacy CRUD representation of the Ultramarines faction.",
      status: "active",
      alignment: "imperium",
      powerLevel: 96,
      raceId: 1,
      imageUrl: null,
      createdAt: "2026-03-07T00:00:00.000Z",
      updatedAt: "2026-03-07T00:00:00.000Z",
    },
    writeExample: {
      name: "Ultramarines",
      summary: "Codex-adherent Space Marine chapter.",
      description: "Legacy CRUD payload for a faction.",
      status: "active",
      alignment: "imperium",
      powerLevel: 96,
      raceId: 1,
      imageUrl: null,
    },
  },
  races: {
    tag: "Races",
    label: "races",
    operationBase: "Race",
    replacement: "/api/v1/races",
    listFilters: ["LegacyNameFilter"],
    itemSchema: "LegacyRaceResource",
    writeSchema: "LegacyRaceWritePayload",
    example: {
      id: 1,
      slug: "human",
      name: "Human",
      summary: "Default race record used by multiple Imperium resources.",
      description: "Legacy CRUD representation of a race.",
      status: "active",
      alignment: "imperium",
      imageUrl: null,
      createdAt: "2026-03-07T00:00:00.000Z",
      updatedAt: "2026-03-07T00:00:00.000Z",
    },
    writeExample: {
      name: "Human",
      summary: "Default race record used by multiple Imperium resources.",
      description: "Legacy CRUD payload for a race.",
      status: "active",
      alignment: "imperium",
      imageUrl: null,
    },
  },
};

function buildListResponseSchema(itemSchemaName, example) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["data", "total"],
    properties: {
      data: {
        type: "array",
        items: {
          $ref: `#/components/schemas/${itemSchemaName}`,
        },
      },
      total: {
        type: "integer",
        minimum: 0,
      },
    },
    example: {
      data: [example],
      total: 1,
    },
  };
}

function buildResponseContent(schemaName, example) {
  return {
    "application/json": {
      schema: {
        $ref: `#/components/schemas/${schemaName}`,
      },
      example,
    },
  };
}

function buildLegacyErrorResponse(description, schemaName = "LegacyStringErrorResponse") {
  return {
    description,
    headers: sharedDeprecationHeaders,
    content: {
      "application/json": {
        schema: {
          $ref: `#/components/schemas/${schemaName}`,
        },
      },
    },
  };
}

function buildReadDescription(config) {
  return [
    `Deprecated legacy CRUD read endpoint for \`${config.label}\`.`,
    `Use \`${config.replacement}\` for the primary public contract with filters, includes, fieldsets, rate limiting and lifecycle docs.`,
  ].join(" ");
}

function buildWriteDescription(config) {
  return [
    `Deprecated legacy CRUD write endpoint for \`${config.label}\`.`,
    "No equivalent write surface exists in `/api/v1`.",
    "Keep this only for legacy CRUD exercises and migration drills.",
  ].join(" ");
}

function buildListPath(config) {
  return {
    get: {
      tags: [config.tag],
      summary: `List ${config.label}`,
      description: buildReadDescription(config),
      operationId: `legacyList${config.operationBase}s`,
      deprecated: true,
      "x-replacement": config.replacement,
      parameters: [
        {
          $ref: "#/components/parameters/LegacyPage",
        },
        {
          $ref: "#/components/parameters/LegacyLimit",
        },
        ...config.listFilters.map((parameterName) => ({
          $ref: `#/components/parameters/${parameterName}`,
        })),
      ],
      responses: {
        200: {
          description: `Legacy paginated ${config.label} response.`,
          headers: sharedDeprecationHeaders,
          content: buildResponseContent(
            `${config.itemSchema.replace("Resource", "")}ListResponse`,
            {
              data: [config.example],
              total: 1,
            }
          ),
        },
        default: buildLegacyErrorResponse(
          "Legacy error response. Read failures can surface as a generic string error."
        ),
      },
    },
    post: {
      tags: [config.tag],
      summary: `Create ${config.label.slice(0, -1)}`,
      description: buildWriteDescription(config),
      operationId: `legacyCreate${config.operationBase}`,
      deprecated: true,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: `#/components/schemas/${config.writeSchema}`,
            },
            example: config.writeExample,
          },
        },
      },
      responses: {
        201: {
          description: `Created ${config.label.slice(0, -1)} in the legacy CRUD surface.`,
          headers: sharedDeprecationHeaders,
          content: buildResponseContent(config.itemSchema, config.example),
        },
        default: buildLegacyErrorResponse(
          "Legacy write error response. Status codes are not fully normalized on `/api`."
        ),
      },
    },
  };
}

function buildDetailPath(config) {
  return {
    get: {
      tags: [config.tag],
      summary: `Get ${config.label.slice(0, -1)} by id`,
      description: `${buildReadDescription(config)} The \`/api/v1\` replacement also accepts slugs.`,
      operationId: `legacyGet${config.operationBase}`,
      deprecated: true,
      "x-replacement": `${config.replacement}/{idOrSlug}`,
      parameters: [
        {
          $ref: "#/components/parameters/LegacyId",
        },
      ],
      responses: {
        200: {
          description: `Legacy ${config.label.slice(0, -1)} record.`,
          headers: sharedDeprecationHeaders,
          content: buildResponseContent(config.itemSchema, config.example),
        },
        default: buildLegacyErrorResponse(
          "Legacy detail error response. Missing entities may bubble through the generic error middleware."
        ),
      },
    },
    put: {
      tags: [config.tag],
      summary: `Update ${config.label.slice(0, -1)}`,
      description: buildWriteDescription(config),
      operationId: `legacyUpdate${config.operationBase}`,
      deprecated: true,
      parameters: [
        {
          $ref: "#/components/parameters/LegacyId",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: `#/components/schemas/${config.writeSchema}`,
            },
            example: config.writeExample,
          },
        },
      },
      responses: {
        200: {
          description: `Updated ${config.label.slice(0, -1)} in the legacy CRUD surface.`,
          headers: sharedDeprecationHeaders,
          content: buildResponseContent(config.itemSchema, config.example),
        },
        default: buildLegacyErrorResponse(
          "Legacy write error response. Missing entities and validation failures are not fully normalized."
        ),
      },
    },
    delete: {
      tags: [config.tag],
      summary: `Delete ${config.label.slice(0, -1)}`,
      description: buildWriteDescription(config),
      operationId: `legacyDelete${config.operationBase}`,
      deprecated: true,
      parameters: [
        {
          $ref: "#/components/parameters/LegacyId",
        },
      ],
      responses: {
        200: {
          description: `Deleted ${config.label.slice(0, -1)} returned by the legacy CRUD surface.`,
          headers: sharedDeprecationHeaders,
          content: buildResponseContent(config.itemSchema, config.example),
        },
        default: buildLegacyErrorResponse(
          "Legacy delete error response. Missing entities can still resolve through the generic middleware."
        ),
      },
    },
  };
}

function buildLegacyPaths() {
  return Object.entries(legacyResources).reduce(
    (paths, [resourceKey, config]) => ({
      ...paths,
      [`/api/${resourceKey}`]: buildListPath(config),
      [`/api/${resourceKey}/{id}`]: buildDetailPath(config),
    }),
    {
      "/api/openapi.json": {
        get: {
          tags: ["Contract"],
          summary: "Legacy OpenAPI contract",
          description:
            "Machine-readable OpenAPI 3.1 document for the deprecated `/api` CRUD surface.",
          operationId: "legacyGetOpenApiSpec",
          deprecated: true,
          responses: {
            200: {
              description: "OpenAPI 3.1 document for the legacy CRUD API.",
              headers: sharedDeprecationHeaders,
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/LegacyOpenApiDocument",
                  },
                  example: {
                    openapi: "3.1.0",
                    info: {
                      title: "Warhammer 40K Legacy CRUD API",
                      version: "legacy-2026-03-07",
                    },
                    paths: {
                      "/api/factions": {},
                    },
                  },
                },
              },
            },
          },
        },
      },
    }
  );
}

function buildLegacyOpenApiSpec() {
  const schemas = Object.entries(legacyResources).reduce((result, [, config]) => {
    result[config.itemSchema] = {
      type: "object",
      additionalProperties: false,
      example: config.example,
      properties: Object.entries(config.example).reduce((properties, [fieldName, value]) => {
        if (typeof value === "number") {
          properties[fieldName] = {
            type: "integer",
            example: value,
          };
        } else if (value === null) {
          properties[fieldName] = {
            type: ["string", "null"],
            example: value,
          };
        } else {
          properties[fieldName] = {
            type: "string",
            example: value,
          };
        }
        return properties;
      }, {}),
    };

    result[config.writeSchema] = {
      type: "object",
      additionalProperties: false,
      required: ["name"],
      example: config.writeExample,
      properties: Object.entries(config.writeExample).reduce((properties, [fieldName, value]) => {
        if (typeof value === "number") {
          properties[fieldName] = {
            type: "integer",
            example: value,
          };
        } else if (value === null) {
          properties[fieldName] = {
            type: ["string", "null"],
            example: value,
          };
        } else {
          properties[fieldName] = {
            type: "string",
            example: value,
          };
        }
        return properties;
      }, {}),
    };

    result[`${config.itemSchema.replace("Resource", "")}ListResponse`] = buildListResponseSchema(
      config.itemSchema,
      config.example
    );

    return result;
  }, {});

  return {
    openapi: "3.1.0",
    info: {
      title: "Warhammer 40K Legacy CRUD API",
      version: "legacy-2026-03-07",
      description: [
        "Machine-readable contract for the deprecated CRUD surface under `/api`.",
        `Deprecated since ${legacyApiPolicy.deprecationDate} and scheduled for sunset on ${legacyApiPolicy.sunsetDate}.`,
        "New read capabilities, docs metadata, validation and generated SDKs are published only for `/api/v1`.",
        "Write operations remain legacy-only and are documented here as-is, including their narrower and less normalized error behavior.",
      ].join(" "),
    },
    jsonSchemaDialect: "https://spec.openapis.org/oas/3.1/dialect/base",
    servers: [
      {
        url: "/",
        description: "Same-origin server",
      },
    ],
    tags: [
      {
        name: "Factions",
        description: "Deprecated CRUD operations for legacy faction records.",
      },
      {
        name: "Characters",
        description: "Deprecated CRUD operations for legacy character records.",
      },
      {
        name: "Races",
        description: "Deprecated CRUD operations for legacy race records.",
      },
      {
        name: "Contract",
        description: "Machine-readable contract endpoints for the legacy surface.",
      },
    ],
    externalDocs: {
      description: "Deprecation policy and migration targets",
      url: "/deprecation-policy",
    },
    paths: buildLegacyPaths(),
    components: {
      parameters: {
        LegacyId: {
          name: "id",
          in: "path",
          required: true,
          description: "Numeric primary key used by the legacy CRUD handlers.",
          schema: {
            type: "integer",
            minimum: 1,
          },
          example: 1,
        },
        LegacyPage: {
          name: "page",
          in: "query",
          required: false,
          description: "Legacy page number. Defaults to 1.",
          schema: {
            type: "integer",
            minimum: 1,
            default: 1,
          },
          example: 1,
        },
        LegacyLimit: {
          name: "limit",
          in: "query",
          required: false,
          description: "Legacy page size. Defaults to 20.",
          schema: {
            type: "integer",
            minimum: 1,
            default: 20,
          },
          example: 20,
        },
        LegacyNameFilter: {
          name: "name",
          in: "query",
          required: false,
          description: "Case-insensitive partial name filter.",
          schema: {
            type: "string",
          },
          example: "guilliman",
        },
        LegacyFactionIdFilter: {
          name: "faction_id",
          in: "query",
          required: false,
          description: "Exact numeric faction id filter for the legacy character list.",
          schema: {
            type: "integer",
            minimum: 1,
          },
          example: 1,
        },
        LegacyRaceIdFilter: {
          name: "race_id",
          in: "query",
          required: false,
          description: "Exact numeric race id filter for the legacy character list.",
          schema: {
            type: "integer",
            minimum: 1,
          },
          example: 1,
        },
      },
      headers: {
        Deprecation: {
          description: deprecationPolicy.headers.find((header) => header.name === "Deprecation")
            .description,
          schema: {
            type: "string",
          },
          example: legacyApiPolicy.deprecationHeader,
        },
        Link: {
          description: deprecationPolicy.headers.find((header) => header.name === "Link")
            .description,
          schema: {
            type: "string",
          },
          example: legacyApiPolicy.linkHeader,
        },
        Sunset: {
          description: deprecationPolicy.headers.find((header) => header.name === "Sunset")
            .description,
          schema: {
            type: "string",
          },
          example: legacyApiPolicy.sunsetHeader,
        },
      },
      schemas: {
        ...schemas,
        LegacyOpenApiDocument: {
          type: "object",
          additionalProperties: true,
          required: ["openapi", "info", "paths"],
          properties: {
            openapi: {
              type: "string",
              example: "3.1.0",
            },
            info: {
              type: "object",
              additionalProperties: true,
            },
            paths: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
        LegacyStringErrorResponse: {
          type: "object",
          additionalProperties: false,
          required: ["error"],
          properties: {
            error: {
              type: "string",
            },
          },
          example: {
            error: "Faction not found",
          },
        },
      },
    },
  };
}

module.exports = {
  buildLegacyOpenApiSpec,
};
