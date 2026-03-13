const changelog = {
  latestVersion: "1.0.0",
  note: "История changelog начинается 2026-03-07. Более ранние изменения не восстанавливаются задним числом без git-tagged релизов.",
  entries: [
    {
      version: "1.0.0",
      releasedOn: "2026-03-07",
      status: "current",
      summary:
        "Публичный docs-first API закреплен как единый контракт под `/api/v1`, с lifecycle-документацией, rate limiting, OpenAPI и generated SDK.",
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
          area: "contract",
          type: "changed",
          text: "Продуктовый target зафиксирован как один публичный API без legacy surface, а docs/navigation выровнены под `/api/v1`.",
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
    "Основной публичный контракт живет под `/api/v1`. Сейчас активных deprecated endpoint-ов нет, а эта policy описывает, как будущие изменения будут объявляться и завершаться.",
  guarantees: [
    "Публичный контракт у продукта один: `/api/v1`.",
    "Новые read-возможности и расширения домена публикуются только в `/api/v1`.",
    "Перед sunset deprecated-пути получают как минимум 90 дней миграционного окна.",
    "Каждое deprecation-решение фиксируется в changelog и в этой policy-странице.",
  ],
  lifecycle: [
    {
      phase: "announce",
      window: "Не менее 90 дней до sunset",
      description:
        "Маршрут получает changelog-запись, policy-обновление и явный replacement или migration note.",
    },
    {
      phase: "deprecated",
      window: "До даты sunset",
      description:
        "Runtime начинает отдавать `Deprecation`, `Sunset` и `Link`, а docs-клиент явно показывает replacement или migration path.",
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
      example: "Deprecation: @1798761600",
      description:
        "Structured date, показывающая момент, когда маршрут официально вошел в deprecated-состояние.",
    },
    {
      name: "Sunset",
      example: "Sunset: Tue, 01 Dec 2026 00:00:00 GMT",
      description: "Плановая дата завершения поддержки deprecated-маршрута.",
    },
    {
      name: "Link",
      example: 'Link: </deprecation-policy>; rel="deprecation"; type="text/html"',
      description: "Ссылка на человекочитаемую policy-страницу с правилами миграции.",
    },
  ],
  activeDeprecations: [],
};

module.exports = {
  changelog,
  deprecationPolicy,
};
