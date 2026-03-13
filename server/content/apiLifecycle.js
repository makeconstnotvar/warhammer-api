const LEGACY_API_DEPRECATION_DATE = "2026-03-07T00:00:00Z";
const LEGACY_API_SUNSET_DATE = "2026-09-30T23:59:59Z";
const LEGACY_API_POLICY_PAGE = "/deprecation-policy";

function toStructuredDateHeader(value) {
  return `@${Math.floor(new Date(value).getTime() / 1000)}`;
}

function toSunsetHeader(value) {
  return new Date(value).toUTCString();
}

const legacyApiMigrationTargets = [
  {
    method: "GET",
    path: "/api/factions",
    replacement: "/api/v1/factions",
    status: "legacy",
    summary:
      "Legacy CRUD list for factions. Use `/api/v1/factions` for include, sort, filters and stable docs.",
  },
  {
    method: "GET",
    path: "/api/characters",
    replacement: "/api/v1/characters",
    status: "legacy",
    summary:
      "Legacy CRUD list for characters. Use `/api/v1/characters` for search, filters and graph-aware relations.",
  },
  {
    method: "GET",
    path: "/api/races",
    replacement: "/api/v1/races",
    status: "legacy",
    summary: "Legacy CRUD list for races. Use `/api/v1/races` for the primary public contract.",
  },
];

const legacyApiPolicy = {
  deprecationDate: LEGACY_API_DEPRECATION_DATE,
  deprecationHeader: toStructuredDateHeader(LEGACY_API_DEPRECATION_DATE),
  linkHeader: `<${LEGACY_API_POLICY_PAGE}>; rel="deprecation"; type="text/html"`,
  policyPage: LEGACY_API_POLICY_PAGE,
  sunsetDate: LEGACY_API_SUNSET_DATE,
  sunsetHeader: toSunsetHeader(LEGACY_API_SUNSET_DATE),
};

const changelog = {
  latestVersion: "1.0.0",
  note: "История changelog начинается 2026-03-07. Более ранние изменения не восстанавливаются задним числом без git-tagged релизов.",
  entries: [
    {
      version: "1.0.0",
      releasedOn: "2026-03-07",
      status: "current",
      summary:
        "Публичный docs-first API получил lifecycle-документацию, а legacy `/api` начал отдавать runtime deprecation headers.",
      changes: [
        {
          area: "docs client",
          type: "added",
          text: "Добавлены страницы Changelog и Deprecation Policy с живыми JSON endpoint-ами под `/api/v1`.",
        },
        {
          area: "public api",
          type: "added",
          text: "Для `/api/v1` включен rate limiting с `RateLimit-*` headers, `Retry-After` и единым 429 error envelope.",
        },
        {
          area: "public api",
          type: "changed",
          text: "Query validation для `list`, `search`, `explore/graph` и `explore/path` теперь агрегирует ошибки в единый `VALIDATION_ERROR.details`.",
        },
        {
          area: "legacy api",
          type: "changed",
          text: "Все маршруты под `/api` теперь отдают `Deprecation`, `Sunset` и `Link` headers, чтобы миграция на `/api/v1` была явной.",
        },
        {
          area: "public surface",
          type: "baseline",
          text: "Текущий основной контракт включает overview, resource catalog, query guide, stats, compare, graph и path поверх PostgreSQL.",
        },
      ],
    },
  ],
};

const deprecationPolicy = {
  summary:
    "Основной публичный контракт живет под `/api/v1`. Старый CRUD-слой `/api` поддерживается как переходный слой и помечен deprecated с 2026-03-07.",
  guarantees: [
    "Новые read-возможности и расширения домена публикуются только в `/api/v1`.",
    "Перед sunset deprecated-пути получают как минимум 90 дней миграционного окна.",
    "Каждое deprecation-решение фиксируется в changelog и в этой policy-странице.",
  ],
  lifecycle: [
    {
      phase: "announce",
      window: "Не менее 90 дней до sunset",
      description: "Маршрут получает changelog-запись, policy-обновление и migration target.",
    },
    {
      phase: "deprecated",
      window: "До даты sunset",
      description:
        "Runtime начинает отдавать `Deprecation`, `Sunset` и `Link`, а docs-клиент явно ведет в replacement endpoint.",
    },
    {
      phase: "sunset",
      window: "После даты sunset",
      description:
        "Маршрут может быть удален или заменен на ответ с инструкцией по миграции, если это согласовано отдельной changelog-записью.",
    },
  ],
  headers: [
    {
      name: "Deprecation",
      example: `Deprecation: ${legacyApiPolicy.deprecationHeader}`,
      description:
        "Structured date, показывающая момент, когда маршрут официально вошел в deprecated-состояние.",
    },
    {
      name: "Sunset",
      example: `Sunset: ${legacyApiPolicy.sunsetHeader}`,
      description: "Плановая дата завершения поддержки deprecated-маршрута.",
    },
    {
      name: "Link",
      example: `Link: ${legacyApiPolicy.linkHeader}`,
      description: "Ссылка на человекочитаемую policy-страницу с правилами миграции.",
    },
  ],
  legacyEndpoints: legacyApiMigrationTargets.map((item) => ({
    ...item,
    deprecatedOn: "2026-03-07",
    sunsetOn: "2026-09-30",
  })),
};

function getLegacyApiDeprecationHeaders() {
  return {
    Deprecation: legacyApiPolicy.deprecationHeader,
    Link: legacyApiPolicy.linkHeader,
    Sunset: legacyApiPolicy.sunsetHeader,
  };
}

module.exports = {
  changelog,
  deprecationPolicy,
  getLegacyApiDeprecationHeaders,
  legacyApiPolicy,
};
