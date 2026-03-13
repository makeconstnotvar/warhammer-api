/**
 * Generated from /api/v1/openapi.json via scripts/generateSdk.js.
 * Do not edit manually.
 */

export type WarhammerOperationId =
  | "compareResources"
  | "getChangelog"
  | "getConcurrencyExample"
  | "getDeprecationPolicy"
  | "getExploreGraph"
  | "getExplorePath"
  | "getOpenApiSpec"
  | "getOverview"
  | "getQueryGuide"
  | "getRandomResource"
  | "getResourceCatalog"
  | "getResourceDetail"
  | "getResourceDocumentation"
  | "getStats"
  | "getWorkbenchScenarios"
  | "listResource"
  | "searchResources";
export type WarhammerHttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
export type WarhammerScalar = string | number | boolean;
export type WarhammerQueryObjectValue =
  | WarhammerScalar
  | readonly WarhammerScalar[]
  | null
  | undefined;
export type WarhammerDeepQueryObject = Record<string, WarhammerQueryObjectValue>;

export interface WarhammerHeadersLike {
  entries(): IterableIterator<[string, string]>;
  get(name: string): string | null;
}

export interface WarhammerResponseLike {
  headers: WarhammerHeadersLike;
  json(): Promise<unknown>;
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export interface WarhammerRequestInit {
  body?: unknown;
  headers?: Record<string, string> | Array<[string, string]>;
  method?: string;
  [key: string]: unknown;
}

export type WarhammerFetchLike = (
  input: string,
  init?: WarhammerRequestInit
) => Promise<WarhammerResponseLike>;

export interface WarhammerOperationParameterDefinition {
  description: string;
  example?: unknown;
  explode: boolean;
  in: "path" | "query";
  name: string;
  required: boolean;
  schema: unknown;
  style: string;
}

export interface WarhammerOperationDefinition {
  method: WarhammerHttpMethod;
  path: string;
  pathParameters: readonly WarhammerOperationParameterDefinition[];
  queryParameters: readonly WarhammerOperationParameterDefinition[];
  summary: string;
  tags: readonly string[];
}

export interface WarhammerApiResponse<TData = unknown> {
  data: TData;
  headers: Record<string, string>;
  operation: WarhammerOperationDefinition;
  status: number;
  url: string;
}

export declare class WarhammerApiError<TData = unknown> extends Error {
  constructor(
    message: string,
    details?: Partial<WarhammerApiResponse<TData>> & {
      data?: TData;
    }
  );

  data: TData;
  headers: Record<string, string>;
  operation: WarhammerOperationDefinition | null;
  status: number;
  url: string;
}

export type BattlefieldIntensityStatsRow = {
  averageIntensityLevel: number;
  count: number;
  id: number;
  maxIntensityLevel: number;
  name: string;
  slug: string;
};

export type BattlefieldsDetailResponse = {
  data?: BattlefieldsResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type BattlefieldsListResponse = {
  data?: Array<BattlefieldsResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type BattlefieldsResource = {
  id?: number;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  status?: string;
  battlefieldType?: string;
  terrain?: string;
  intensityLevel?: number;
  planetId?: number;
  starSystemId?: number;
  eraId?: number;
  factionIds?: Array<number>;
  characterIds?: Array<number>;
  campaignIds?: Array<number>;
  keywords?: Array<string>;
};

export type CampaignOrganizationStatsRow = {
  activeCount: number;
  count: number;
  id: number;
  latestYearLabel: string;
  latestYearOrder: number;
  name: string;
  organizationType: string;
  slug: string;
};

export type CampaignsDetailResponse = {
  data?: CampaignsResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type CampaignsListResponse = {
  data?: Array<CampaignsResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type CampaignsResource = {
  id?: number;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  status?: string;
  campaignType?: string;
  eraId?: number;
  yearLabel?: string;
  yearOrder?: number;
  planetIds?: Array<number>;
  factionIds?: Array<number>;
  characterIds?: Array<number>;
  organizationIds?: Array<number>;
  keywords?: Array<string>;
  battlefieldIds?: Array<number>;
};

export type ChangelogResponse = {
  data?: {
    latestVersion?: string;
    note?: string;
    entries?: Array<{
      version?: string;
      releasedOn?: string;
      status?: string;
      summary?: string;
      changes?: Array<{
        area?: string;
        type?: string;
        text?: string;
      }>;
    }>;
  };
  meta?: {
    basePath?: string;
    currentVersion?: string;
  };
};

export type CharactersDetailResponse = {
  data?: CharactersResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type CharactersListResponse = {
  data?: Array<CharactersResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type CharactersResource = {
  id?: number;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  status?: string;
  factionId?: number;
  raceId?: number;
  homeworldId?: number;
  eraId?: number;
  eventIds?: Array<number>;
  titles?: Array<string>;
  keywords?: Array<string>;
  alignment?: string;
  powerLevel?: number;
};

export type CompareResponse = {
  data?: {
    comparison?: Record<string, unknown>;
    items?: Array<
      | BattlefieldsResource
      | CampaignsResource
      | CharactersResource
      | FactionsResource
      | OrganizationsResource
      | RelicsResource
      | StarSystemsResource
      | UnitsResource
    >;
    resource?:
      | "battlefields"
      | "campaigns"
      | "characters"
      | "factions"
      | "organizations"
      | "relics"
      | "star-systems"
      | "units";
  };
  included?: IncludedResources;
  meta?: {
    count?: number;
    identifiers?: Array<string>;
    include?: Array<string>;
    resource?:
      | "battlefields"
      | "campaigns"
      | "characters"
      | "factions"
      | "organizations"
      | "relics"
      | "star-systems"
      | "units";
  };
};

export type ConcurrencyExampleResponse = {
  data?: {
    title?: string;
    description?: string;
    endpoints?: Array<string>;
    code?: string;
  };
  meta?: {
    basePath?: string;
  };
};

export type DeprecationPolicyResponse = {
  data?: {
    summary?: string;
    guarantees?: Array<string>;
    lifecycle?: Array<{
      phase?: string;
      window?: string;
      description?: string;
    }>;
    headers?: Array<{
      name?: string;
      example?: string;
      description?: string;
    }>;
    activeDeprecations?: Array<string>;
  };
  meta?: {
    basePath?: string;
    currentVersion?: string;
  };
};

export type DetailMeta = {
  include?: Array<string>;
  resource?: string;
  strategy?: string;
};

export type ErasDetailResponse = {
  data?: ErasResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type ErasListResponse = {
  data?: Array<ErasResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type ErasResource = {
  id?: number;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  status?: string;
  yearLabel?: string;
  yearOrder?: number;
  keywords?: Array<string>;
};

export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: Array<Record<string, unknown>>;
  };
};

export type EventEraStatsRow = {
  count: number;
  id: number;
  name: string;
  slug: string;
  yearLabel: string;
  yearOrder: number;
};

export type EventsDetailResponse = {
  data?: EventsResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type EventsListResponse = {
  data?: Array<EventsResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type EventsResource = {
  id?: number;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  status?: string;
  eraId?: number;
  yearLabel?: string;
  yearOrder?: number;
  planetIds?: Array<number>;
  factionIds?: Array<number>;
  characterIds?: Array<number>;
  keywords?: Array<string>;
};

export type FactionCountStatsRow = {
  count: number;
  id: number;
  name: string;
  slug: string;
};

export type FactionsDetailResponse = {
  data?: FactionsResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type FactionsListResponse = {
  data?: Array<FactionsResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type FactionsResource = {
  id?: number;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  status?: string;
  alignment?: string;
  raceIds?: Array<number>;
  homeworldId?: number;
  eraId?: number;
  leaderIds?: Array<number>;
  keywords?: Array<string>;
  powerLevel?: number;
};

export type FleetsDetailResponse = {
  data?: FleetsResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type FleetsListResponse = {
  data?: Array<FleetsResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type FleetsResource = {
  id?: number;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  status?: string;
  fleetType?: string;
  mobilityClass?: string;
  strengthRating?: number;
  currentStarSystemId?: number;
  homePortPlanetId?: number;
  eraId?: number;
  factionIds?: Array<number>;
  commanderIds?: Array<number>;
  campaignIds?: Array<number>;
  keywords?: Array<string>;
};

export type GraphEdge = {
  direction: "incoming" | "outgoing";
  from: string;
  id: string;
  label: string;
  relation: string;
  sourceResource:
    | "eras"
    | "races"
    | "star-systems"
    | "warp-routes"
    | "planets"
    | "factions"
    | "fleets"
    | "organizations"
    | "keywords"
    | "weapons"
    | "relics"
    | "units"
    | "events"
    | "campaigns"
    | "battlefields"
    | "characters";
  targetResource:
    | "eras"
    | "races"
    | "star-systems"
    | "warp-routes"
    | "planets"
    | "factions"
    | "fleets"
    | "organizations"
    | "keywords"
    | "weapons"
    | "relics"
    | "units"
    | "events"
    | "campaigns"
    | "battlefields"
    | "characters";
  to: string;
};

export type GraphNode = {
  distance: number;
  id: number;
  influenceLevel?: number | null;
  key: string;
  name: string;
  powerLevel?: number | null;
  resource:
    | "eras"
    | "races"
    | "star-systems"
    | "warp-routes"
    | "planets"
    | "factions"
    | "fleets"
    | "organizations"
    | "keywords"
    | "weapons"
    | "relics"
    | "units"
    | "events"
    | "campaigns"
    | "battlefields"
    | "characters";
  slug?: string | null;
  status?: string | null;
  summary?: string | null;
  type?: string | null;
  yearLabel?: string | null;
};

export type GraphResponse = {
  data: {
    edges: Array<GraphEdge>;
    nodes: Array<GraphNode>;
    root: GraphNode;
  };
  included: IncludedResources;
  meta: {
    backlinks: boolean;
    depth: number;
    edgeCount: number;
    identifier: string;
    limitPerRelation: number;
    nodeCount: number;
    requestedResourceTypes: Array<
      | "eras"
      | "races"
      | "star-systems"
      | "warp-routes"
      | "planets"
      | "factions"
      | "fleets"
      | "organizations"
      | "keywords"
      | "weapons"
      | "relics"
      | "units"
      | "events"
      | "campaigns"
      | "battlefields"
      | "characters"
    >;
    resource:
      | "eras"
      | "races"
      | "star-systems"
      | "warp-routes"
      | "planets"
      | "factions"
      | "fleets"
      | "organizations"
      | "keywords"
      | "weapons"
      | "relics"
      | "units"
      | "events"
      | "campaigns"
      | "battlefields"
      | "characters";
    resourceTypes: Array<
      | "eras"
      | "races"
      | "star-systems"
      | "warp-routes"
      | "planets"
      | "factions"
      | "fleets"
      | "organizations"
      | "keywords"
      | "weapons"
      | "relics"
      | "units"
      | "events"
      | "campaigns"
      | "battlefields"
      | "characters"
    >;
    truncatedRelations: Array<GraphTruncatedRelation>;
  };
};

export type GraphTruncatedRelation = {
  from: string;
  hiddenCount: number;
  label: string;
  relation: string;
  sourceResource?:
    | "eras"
    | "races"
    | "star-systems"
    | "warp-routes"
    | "planets"
    | "factions"
    | "fleets"
    | "organizations"
    | "keywords"
    | "weapons"
    | "relics"
    | "units"
    | "events"
    | "campaigns"
    | "battlefields"
    | "characters";
  targetResource?:
    | "eras"
    | "races"
    | "star-systems"
    | "warp-routes"
    | "planets"
    | "factions"
    | "fleets"
    | "organizations"
    | "keywords"
    | "weapons"
    | "relics"
    | "units"
    | "events"
    | "campaigns"
    | "battlefields"
    | "characters";
};

export type IncludedResources = {
  eras?: Array<ErasResource>;
  races?: Array<RacesResource>;
  "star-systems"?: Array<StarSystemsResource>;
  "warp-routes"?: Array<WarpRoutesResource>;
  planets?: Array<PlanetsResource>;
  factions?: Array<FactionsResource>;
  fleets?: Array<FleetsResource>;
  organizations?: Array<OrganizationsResource>;
  keywords?: Array<KeywordsResource>;
  weapons?: Array<WeaponsResource>;
  relics?: Array<RelicsResource>;
  units?: Array<UnitsResource>;
  events?: Array<EventsResource>;
  campaigns?: Array<CampaignsResource>;
  battlefields?: Array<BattlefieldsResource>;
  characters?: Array<CharactersResource>;
};

export type KeywordsDetailResponse = {
  data?: KeywordsResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type KeywordsListResponse = {
  data?: Array<KeywordsResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type KeywordsResource = {
  id?: number;
  slug?: string;
  name?: string;
  description?: string;
  category?: string;
};

export type ListMeta = {
  appliedFilters?: Record<string, unknown>;
  include?: Array<string>;
  limit?: number;
  page?: number;
  resource?: string;
  search?: string;
  sort?: Array<string>;
  total?: number;
  totalPages?: number;
};

export type OpenApiDocument = {
  openapi?: string;
  info?: {
    title?: string;
    version?: string;
  };
  paths?: Record<string, never>;
};

export type OrganizationsDetailResponse = {
  data?: OrganizationsResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type OrganizationsListResponse = {
  data?: Array<OrganizationsResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type OrganizationsResource = {
  id?: number;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  status?: string;
  organizationType?: string;
  influenceLevel?: number;
  homeworldId?: number;
  eraId?: number;
  factionIds?: Array<number>;
  leaderIds?: Array<number>;
  keywords?: Array<string>;
};

export type OverviewResponse = {
  data?: {
    api?: {
      title?: string;
      version?: string;
      description?: string;
      audience?: string;
      basePath?: string;
      rateLimit?: {
        headers?: Array<{
          name?: string;
          example?: string;
          description?: string;
        }>;
        limit?: number;
        policy?: string;
        scope?: string;
        windowMs?: number;
        windowSeconds?: number;
      };
    };
    featuredQueries?: Array<{
      title?: string;
      description?: string;
      path?: string;
    }>;
    gettingStartedSteps?: Array<{
      title?: string;
      description?: string;
      endpoint?: string;
    }>;
    interactiveScenarios?: {
      compare?: Array<{
        id?: string;
        label?: string;
        description?: string;
        difficulty?: string;
        featured?: boolean;
        path?: string;
        pathResources?: Array<string>;
        tags?: Array<string>;
      }>;
      graph?: Array<{
        id?: string;
        label?: string;
        description?: string;
        difficulty?: string;
        featured?: boolean;
        path?: string;
        tags?: Array<string>;
      }>;
      path?: Array<{
        id?: string;
        label?: string;
        description?: string;
        difficulty?: string;
        featured?: boolean;
        path?: string;
        tags?: Array<string>;
      }>;
    };
    resources?: Array<{
      count?: number;
      description?: string;
      filters?: Array<{
        id?: string;
        label?: string;
        type?: string;
      }>;
      id?: string;
      include?: Array<string>;
      label?: string;
      path?: string;
      previewParams?: {
        limit?: number;
        sort?: string;
      };
      sampleQueries?: Array<string>;
    }>;
  };
  meta?: {
    generatedAt?: string;
  };
};

export type PaginationLinks = {
  self?: string;
  next?: string;
  prev?: string;
};

export type PathResponse = {
  data: {
    found: boolean;
    from: GraphNode;
    path: {
      edges: Array<{
        direction: "incoming" | "outgoing";
        from: string;
        id: string;
        label: string;
        pathIndex: number;
        relation: string;
        sourceResource:
          | "eras"
          | "races"
          | "star-systems"
          | "warp-routes"
          | "planets"
          | "factions"
          | "fleets"
          | "organizations"
          | "keywords"
          | "weapons"
          | "relics"
          | "units"
          | "events"
          | "campaigns"
          | "battlefields"
          | "characters";
        targetResource:
          | "eras"
          | "races"
          | "star-systems"
          | "warp-routes"
          | "planets"
          | "factions"
          | "fleets"
          | "organizations"
          | "keywords"
          | "weapons"
          | "relics"
          | "units"
          | "events"
          | "campaigns"
          | "battlefields"
          | "characters";
        to: string;
        traversal: "forward" | "reverse";
      }>;
      length: number;
      nodes: Array<GraphNode>;
    };
    to: GraphNode;
  };
  included: IncludedResources;
  meta: {
    backlinks: boolean;
    fromIdentifier: string;
    fromResource:
      | "eras"
      | "races"
      | "star-systems"
      | "warp-routes"
      | "planets"
      | "factions"
      | "fleets"
      | "organizations"
      | "keywords"
      | "weapons"
      | "relics"
      | "units"
      | "events"
      | "campaigns"
      | "battlefields"
      | "characters";
    limitPerRelation: number;
    maxDepth: number;
    requestedResourceTypes: Array<
      | "eras"
      | "races"
      | "star-systems"
      | "warp-routes"
      | "planets"
      | "factions"
      | "fleets"
      | "organizations"
      | "keywords"
      | "weapons"
      | "relics"
      | "units"
      | "events"
      | "campaigns"
      | "battlefields"
      | "characters"
    >;
    resourceTypes: Array<
      | "eras"
      | "races"
      | "star-systems"
      | "warp-routes"
      | "planets"
      | "factions"
      | "fleets"
      | "organizations"
      | "keywords"
      | "weapons"
      | "relics"
      | "units"
      | "events"
      | "campaigns"
      | "battlefields"
      | "characters"
    >;
    toIdentifier: string;
    toResource:
      | "eras"
      | "races"
      | "star-systems"
      | "warp-routes"
      | "planets"
      | "factions"
      | "fleets"
      | "organizations"
      | "keywords"
      | "weapons"
      | "relics"
      | "units"
      | "events"
      | "campaigns"
      | "battlefields"
      | "characters";
    truncatedRelations: Array<GraphTruncatedRelation>;
    visitedNodeCount: number;
  };
};

export type PlanetsDetailResponse = {
  data?: PlanetsResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type PlanetsListResponse = {
  data?: Array<PlanetsResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type PlanetsResource = {
  id?: number;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  status?: string;
  type?: string;
  sector?: string;
  eraId?: number;
  starSystemId?: number;
  keywords?: Array<string>;
};

export type PowerLevelStatsRow = {
  averagePowerLevel: number;
  count: number;
  id: number;
  maxPowerLevel: number;
  name: string;
  slug: string;
};

export type QueryGuideResponse = {
  data?: {
    params?: Array<{
      name?: string;
      example?: string;
      description?: string;
    }>;
    responseShapes?: {
      list?: {
        data?: Array<string>;
        meta?: {
          page?: number;
          limit?: number;
          total?: number;
          totalPages?: number;
          resource?: string;
        };
        links?: {
          self?: string;
          next?: string;
        };
        included?: {
          factions?: Array<string>;
          races?: Array<string>;
        };
      };
      detail?: {
        data?: Record<string, never>;
        meta?: {
          resource?: string;
        };
        included?: Record<string, never>;
      };
      error?: {
        error?: {
          code?: string;
          message?: string;
          details?: Array<{
            field?: string;
            code?: string;
            message?: string;
            value?: string;
          }>;
        };
      };
      rateLimitError?: {
        error?: {
          code?: string;
          message?: string;
          details?: Array<{
            limit?: number;
            policy?: string;
            resetInSeconds?: number;
            scope?: string;
          }>;
        };
      };
    };
    scenarios?: Array<{
      title?: string;
      description?: string;
      path?: string;
    }>;
    rateLimit?: {
      headers?: Array<{
        name?: string;
        example?: string;
        description?: string;
      }>;
      limit?: number;
      policy?: string;
      scope?: string;
      windowMs?: number;
      windowSeconds?: number;
    };
  };
  meta?: {
    basePath?: string;
  };
};

export type RacesDetailResponse = {
  data?: RacesResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type RacesListResponse = {
  data?: Array<RacesResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type RacesResource = {
  id?: number;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  status?: string;
  alignment?: string;
  keywords?: Array<string>;
};

export type RateLimitErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    details?: Array<{
      limit?: number;
      policy?: string;
      resetInSeconds?: number;
      scope?: string;
    }>;
  };
};

export type RelicsDetailResponse = {
  data?: RelicsResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type RelicsListResponse = {
  data?: Array<RelicsResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type RelicsResource = {
  id?: number;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  status?: string;
  relicType?: string;
  powerLevel?: number;
  factionId?: number;
  bearerCharacterId?: number;
  originPlanetId?: number;
  eraId?: number;
  keywordIds?: Array<number>;
};

export type ResourceCatalogResponse = {
  data?: Array<{
    count?: number;
    description?: string;
    filters?: Array<{
      id?: string;
      label?: string;
      type?: string;
    }>;
    id?: string;
    include?: Array<string>;
    label?: string;
    path?: string;
    previewParams?: {
      limit?: number;
      sort?: string;
    };
    sampleQueries?: Array<string>;
  }>;
  meta?: {
    total?: number;
  };
};

export type ResourceDocumentationResponse = {
  data?: {
    count?: number;
    defaultSort?: string;
    description?: string;
    fields?: Array<{
      name?: string;
      type?: string;
      description?: string;
    }>;
    filters?: Array<{
      id?: string;
      label?: string;
      type?: string;
    }>;
    id?: string;
    includes?: Array<{
      id?: string;
      label?: string;
      resource?: string;
    }>;
    label?: string;
    path?: string;
    previewParams?: {
      limit?: number;
      sort?: string;
      include?: string;
    };
    sampleQueries?: Array<string>;
  };
  meta?: {
    basePath?: string;
  };
};

export type SearchResponse = {
  data?: Array<{
    id?: number;
    name?: string;
    rank?: number;
    resource?: string;
    slug?: string;
    summary?: string;
  }>;
  meta?: {
    limit?: number;
    page?: number;
    resource?: string;
    resources?: Array<string>;
    search?: string;
    total?: number;
  };
  links?: {
    self?: string;
  };
};

export type SegmentumStatsRow = {
  activeCount: number;
  count: number;
  id: number;
  name: string;
  planetCount: number;
  slug: string;
};

export type StarSystemsDetailResponse = {
  data?: StarSystemsResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type StarSystemsListResponse = {
  data?: Array<StarSystemsResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type StarSystemsResource = {
  id?: number;
  slug?: string;
  name?: string;
  segmentum?: string;
  planetIds?: Array<number>;
};

export type StatsMeta = {
  groupBy: string;
  resource:
    | "factions"
    | "events"
    | "units"
    | "weapons"
    | "relics"
    | "campaigns"
    | "battlefields"
    | "star-systems";
  total: number;
};

export type StatsResponse = {
  data: Array<
    | FactionCountStatsRow
    | PowerLevelStatsRow
    | CampaignOrganizationStatsRow
    | BattlefieldIntensityStatsRow
    | SegmentumStatsRow
    | WeaponKeywordStatsRow
    | EventEraStatsRow
  >;
  meta: StatsMeta;
};

export type UnitsDetailResponse = {
  data?: UnitsResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type UnitsListResponse = {
  data?: Array<UnitsResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type UnitsResource = {
  id?: number;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  status?: string;
  unitType?: string;
  powerLevel?: number;
  eraId?: number;
  factionIds?: Array<number>;
  keywordIds?: Array<number>;
  weaponIds?: Array<number>;
};

export type ValidationErrorDetail = {
  code?: string;
  field?: string;
  message?: string;
  value?: string | number | boolean | Array<string>;
  [key: string]: unknown;
};

export type ValidationErrorResponse = {
  error: {
    code: "VALIDATION_ERROR";
    message: string;
    details: Array<ValidationErrorDetail>;
  };
};

export type WarpRoutesDetailResponse = {
  data?: WarpRoutesResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type WarpRoutesListResponse = {
  data?: Array<WarpRoutesResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type WarpRoutesResource = {
  id?: number;
  slug?: string;
  name?: string;
  routeType?: string;
  stabilityLevel?: number;
  transitTimeRating?: number;
  fromStarSystemId?: number;
  toStarSystemId?: number;
};

export type WeaponKeywordStatsRow = {
  averagePowerLevel: number;
  category: string;
  count: number;
  id: number;
  maxPowerLevel: number;
  name: string;
  slug: string;
};

export type WeaponsDetailResponse = {
  data?: WeaponsResource;
  included?: IncludedResources;
  meta?: DetailMeta;
};

export type WeaponsListResponse = {
  data?: Array<WeaponsResource>;
  included?: IncludedResources;
  links?: PaginationLinks;
  meta?: ListMeta;
};

export type WeaponsResource = {
  id?: number;
  slug?: string;
  name?: string;
  summary?: string;
  description?: string;
  status?: string;
  weaponType?: string;
  powerLevel?: number;
  factionId?: number;
  eraId?: number;
  keywordIds?: Array<number>;
};

export type WorkbenchScenariosResponse = {
  data?: {
    compare?: Array<{
      id?: string;
      label?: string;
      description?: string;
      difficulty?: string;
      featured?: boolean;
      path?: string;
      pathResources?: Array<string>;
      tags?: Array<string>;
    }>;
    graph?: Array<{
      id?: string;
      label?: string;
      description?: string;
      difficulty?: string;
      featured?: boolean;
      path?: string;
      tags?: Array<string>;
    }>;
    path?: Array<{
      id?: string;
      label?: string;
      description?: string;
      difficulty?: string;
      featured?: boolean;
      path?: string;
      tags?: Array<string>;
    }>;
  };
  meta?: {
    basePath?: string;
    groups?: {
      compare?: number;
      graph?: number;
      path?: number;
    };
    total?: number;
  };
};

export type CompareResourcesResponseBody = CompareResponse;

export type GetChangelogResponseBody = ChangelogResponse;

export type GetConcurrencyExampleResponseBody = ConcurrencyExampleResponse;

export type GetDeprecationPolicyResponseBody = DeprecationPolicyResponse;

export type GetExploreGraphResponseBody = GraphResponse;

export type GetExplorePathResponseBody = PathResponse;

export type GetOpenApiSpecResponseBody = OpenApiDocument;

export type GetOverviewResponseBody = OverviewResponse;

export type GetQueryGuideResponseBody = QueryGuideResponse;

export type GetRandomResourceResponseBody =
  | ErasDetailResponse
  | RacesDetailResponse
  | StarSystemsDetailResponse
  | WarpRoutesDetailResponse
  | PlanetsDetailResponse
  | FactionsDetailResponse
  | FleetsDetailResponse
  | OrganizationsDetailResponse
  | KeywordsDetailResponse
  | WeaponsDetailResponse
  | RelicsDetailResponse
  | UnitsDetailResponse
  | EventsDetailResponse
  | CampaignsDetailResponse
  | BattlefieldsDetailResponse
  | CharactersDetailResponse;

export type GetResourceCatalogResponseBody = ResourceCatalogResponse;

export type GetResourceDetailResponseBody =
  | ErasDetailResponse
  | RacesDetailResponse
  | StarSystemsDetailResponse
  | WarpRoutesDetailResponse
  | PlanetsDetailResponse
  | FactionsDetailResponse
  | FleetsDetailResponse
  | OrganizationsDetailResponse
  | KeywordsDetailResponse
  | WeaponsDetailResponse
  | RelicsDetailResponse
  | UnitsDetailResponse
  | EventsDetailResponse
  | CampaignsDetailResponse
  | BattlefieldsDetailResponse
  | CharactersDetailResponse;

export type GetResourceDocumentationResponseBody = ResourceDocumentationResponse;

export type GetStatsResponseBody = StatsResponse;

export type GetWorkbenchScenariosResponseBody = WorkbenchScenariosResponse;

export type ListResourceResponseBody =
  | ErasListResponse
  | RacesListResponse
  | StarSystemsListResponse
  | WarpRoutesListResponse
  | PlanetsListResponse
  | FactionsListResponse
  | FleetsListResponse
  | OrganizationsListResponse
  | KeywordsListResponse
  | WeaponsListResponse
  | RelicsListResponse
  | UnitsListResponse
  | EventsListResponse
  | CampaignsListResponse
  | BattlefieldsListResponse
  | CharactersListResponse;

export type SearchResourcesResponseBody = SearchResponse;

export interface CompareResourcesQuery {
  ids: string | readonly string[];
  include?: string | readonly string[];
  fields?: WarhammerDeepQueryObject;
}

export interface GetChangelogQuery {}

export interface GetConcurrencyExampleQuery {}

export interface GetDeprecationPolicyQuery {}

export interface GetExploreGraphQuery {
  resource:
    | "eras"
    | "races"
    | "star-systems"
    | "warp-routes"
    | "planets"
    | "factions"
    | "fleets"
    | "organizations"
    | "keywords"
    | "weapons"
    | "relics"
    | "units"
    | "events"
    | "campaigns"
    | "battlefields"
    | "characters";
  identifier: string;
  depth?: number;
  limitPerRelation?: number;
  backlinks?: boolean;
  resources?: string | readonly string[];
}

export interface GetExplorePathQuery {
  fromResource:
    | "eras"
    | "races"
    | "star-systems"
    | "warp-routes"
    | "planets"
    | "factions"
    | "fleets"
    | "organizations"
    | "keywords"
    | "weapons"
    | "relics"
    | "units"
    | "events"
    | "campaigns"
    | "battlefields"
    | "characters";
  fromIdentifier: string;
  toResource:
    | "eras"
    | "races"
    | "star-systems"
    | "warp-routes"
    | "planets"
    | "factions"
    | "fleets"
    | "organizations"
    | "keywords"
    | "weapons"
    | "relics"
    | "units"
    | "events"
    | "campaigns"
    | "battlefields"
    | "characters";
  toIdentifier: string;
  maxDepth?: number;
  limitPerRelation?: number;
  backlinks?: boolean;
  resources?: string | readonly string[];
}

export interface GetOpenApiSpecQuery {}

export interface GetOverviewQuery {}

export interface GetQueryGuideQuery {}

export interface GetRandomResourceQuery {
  include?: string | readonly string[];
  fields?: WarhammerDeepQueryObject;
}

export interface GetResourceCatalogQuery {}

export interface GetResourceDetailQuery {
  include?: string | readonly string[];
  fields?: WarhammerDeepQueryObject;
}

export interface GetResourceDocumentationQuery {}

export interface GetStatsQuery {}

export interface GetWorkbenchScenariosQuery {}

export interface ListResourceQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string | readonly string[];
  include?: string | readonly string[];
  filter?: WarhammerDeepQueryObject;
  fields?: WarhammerDeepQueryObject;
}

export interface SearchResourcesQuery {
  search: string;
  limit?: number;
  resources?: string | readonly string[];
}

export interface CompareResourcesOptions {
  resource:
    | "battlefields"
    | "campaigns"
    | "characters"
    | "factions"
    | "organizations"
    | "relics"
    | "star-systems"
    | "units";
  query: CompareResourcesQuery;
  init?: WarhammerRequestInit;
}

export interface GetChangelogOptions {
  query?: GetChangelogQuery;
  init?: WarhammerRequestInit;
}

export interface GetConcurrencyExampleOptions {
  query?: GetConcurrencyExampleQuery;
  init?: WarhammerRequestInit;
}

export interface GetDeprecationPolicyOptions {
  query?: GetDeprecationPolicyQuery;
  init?: WarhammerRequestInit;
}

export interface GetExploreGraphOptions {
  query: GetExploreGraphQuery;
  init?: WarhammerRequestInit;
}

export interface GetExplorePathOptions {
  query: GetExplorePathQuery;
  init?: WarhammerRequestInit;
}

export interface GetOpenApiSpecOptions {
  query?: GetOpenApiSpecQuery;
  init?: WarhammerRequestInit;
}

export interface GetOverviewOptions {
  query?: GetOverviewQuery;
  init?: WarhammerRequestInit;
}

export interface GetQueryGuideOptions {
  query?: GetQueryGuideQuery;
  init?: WarhammerRequestInit;
}

export interface GetRandomResourceOptions {
  resource:
    | "eras"
    | "races"
    | "star-systems"
    | "warp-routes"
    | "planets"
    | "factions"
    | "fleets"
    | "organizations"
    | "keywords"
    | "weapons"
    | "relics"
    | "units"
    | "events"
    | "campaigns"
    | "battlefields"
    | "characters";
  query?: GetRandomResourceQuery;
  init?: WarhammerRequestInit;
}

export interface GetResourceCatalogOptions {
  query?: GetResourceCatalogQuery;
  init?: WarhammerRequestInit;
}

export interface GetResourceDetailOptions {
  resource:
    | "eras"
    | "races"
    | "star-systems"
    | "warp-routes"
    | "planets"
    | "factions"
    | "fleets"
    | "organizations"
    | "keywords"
    | "weapons"
    | "relics"
    | "units"
    | "events"
    | "campaigns"
    | "battlefields"
    | "characters";
  idOrSlug: string;
  query?: GetResourceDetailQuery;
  init?: WarhammerRequestInit;
}

export interface GetResourceDocumentationOptions {
  resource:
    | "eras"
    | "races"
    | "star-systems"
    | "warp-routes"
    | "planets"
    | "factions"
    | "fleets"
    | "organizations"
    | "keywords"
    | "weapons"
    | "relics"
    | "units"
    | "events"
    | "campaigns"
    | "battlefields"
    | "characters";
  query?: GetResourceDocumentationQuery;
  init?: WarhammerRequestInit;
}

export interface GetStatsOptions {
  resource:
    | "factions"
    | "events"
    | "units"
    | "weapons"
    | "relics"
    | "campaigns"
    | "battlefields"
    | "star-systems";
  groupKey: "by-race" | "by-era" | "by-faction" | "by-keyword" | "by-organization" | "by-segmentum";
  query?: GetStatsQuery;
  init?: WarhammerRequestInit;
}

export interface GetWorkbenchScenariosOptions {
  query?: GetWorkbenchScenariosQuery;
  init?: WarhammerRequestInit;
}

export interface ListResourceOptions {
  resource:
    | "eras"
    | "races"
    | "star-systems"
    | "warp-routes"
    | "planets"
    | "factions"
    | "fleets"
    | "organizations"
    | "keywords"
    | "weapons"
    | "relics"
    | "units"
    | "events"
    | "campaigns"
    | "battlefields"
    | "characters";
  query?: ListResourceQuery;
  init?: WarhammerRequestInit;
}

export interface SearchResourcesOptions {
  query: SearchResourcesQuery;
  init?: WarhammerRequestInit;
}

export interface WarhammerOperationOptionsMap {
  compareResources: CompareResourcesOptions;
  getChangelog: GetChangelogOptions;
  getConcurrencyExample: GetConcurrencyExampleOptions;
  getDeprecationPolicy: GetDeprecationPolicyOptions;
  getExploreGraph: GetExploreGraphOptions;
  getExplorePath: GetExplorePathOptions;
  getOpenApiSpec: GetOpenApiSpecOptions;
  getOverview: GetOverviewOptions;
  getQueryGuide: GetQueryGuideOptions;
  getRandomResource: GetRandomResourceOptions;
  getResourceCatalog: GetResourceCatalogOptions;
  getResourceDetail: GetResourceDetailOptions;
  getResourceDocumentation: GetResourceDocumentationOptions;
  getStats: GetStatsOptions;
  getWorkbenchScenarios: GetWorkbenchScenariosOptions;
  listResource: ListResourceOptions;
  searchResources: SearchResourcesOptions;
}

export interface WarhammerOperationResponseMap {
  compareResources: CompareResourcesResponseBody;
  getChangelog: GetChangelogResponseBody;
  getConcurrencyExample: GetConcurrencyExampleResponseBody;
  getDeprecationPolicy: GetDeprecationPolicyResponseBody;
  getExploreGraph: GetExploreGraphResponseBody;
  getExplorePath: GetExplorePathResponseBody;
  getOpenApiSpec: GetOpenApiSpecResponseBody;
  getOverview: GetOverviewResponseBody;
  getQueryGuide: GetQueryGuideResponseBody;
  getRandomResource: GetRandomResourceResponseBody;
  getResourceCatalog: GetResourceCatalogResponseBody;
  getResourceDetail: GetResourceDetailResponseBody;
  getResourceDocumentation: GetResourceDocumentationResponseBody;
  getStats: GetStatsResponseBody;
  getWorkbenchScenarios: GetWorkbenchScenariosResponseBody;
  listResource: ListResourceResponseBody;
  searchResources: SearchResourcesResponseBody;
}

export interface WarhammerOperationsMap {
  compareResources: WarhammerOperationDefinition;
  getChangelog: WarhammerOperationDefinition;
  getConcurrencyExample: WarhammerOperationDefinition;
  getDeprecationPolicy: WarhammerOperationDefinition;
  getExploreGraph: WarhammerOperationDefinition;
  getExplorePath: WarhammerOperationDefinition;
  getOpenApiSpec: WarhammerOperationDefinition;
  getOverview: WarhammerOperationDefinition;
  getQueryGuide: WarhammerOperationDefinition;
  getRandomResource: WarhammerOperationDefinition;
  getResourceCatalog: WarhammerOperationDefinition;
  getResourceDetail: WarhammerOperationDefinition;
  getResourceDocumentation: WarhammerOperationDefinition;
  getStats: WarhammerOperationDefinition;
  getWorkbenchScenarios: WarhammerOperationDefinition;
  listResource: WarhammerOperationDefinition;
  searchResources: WarhammerOperationDefinition;
}

export interface WarhammerApiClient {
  operations: WarhammerOperationsMap;
  request<TOperationId extends WarhammerOperationId>(
    operationId: TOperationId,
    options?: WarhammerOperationOptionsMap[TOperationId]
  ): Promise<WarhammerApiResponse<WarhammerOperationResponseMap[TOperationId]>>;
  compareResources(
    options: CompareResourcesOptions
  ): Promise<WarhammerApiResponse<CompareResourcesResponseBody>>;
  getChangelog(
    options?: GetChangelogOptions
  ): Promise<WarhammerApiResponse<GetChangelogResponseBody>>;
  getConcurrencyExample(
    options?: GetConcurrencyExampleOptions
  ): Promise<WarhammerApiResponse<GetConcurrencyExampleResponseBody>>;
  getDeprecationPolicy(
    options?: GetDeprecationPolicyOptions
  ): Promise<WarhammerApiResponse<GetDeprecationPolicyResponseBody>>;
  getExploreGraph(
    options: GetExploreGraphOptions
  ): Promise<WarhammerApiResponse<GetExploreGraphResponseBody>>;
  getExplorePath(
    options: GetExplorePathOptions
  ): Promise<WarhammerApiResponse<GetExplorePathResponseBody>>;
  getOpenApiSpec(
    options?: GetOpenApiSpecOptions
  ): Promise<WarhammerApiResponse<GetOpenApiSpecResponseBody>>;
  getOverview(options?: GetOverviewOptions): Promise<WarhammerApiResponse<GetOverviewResponseBody>>;
  getQueryGuide(
    options?: GetQueryGuideOptions
  ): Promise<WarhammerApiResponse<GetQueryGuideResponseBody>>;
  getRandomResource(
    options: GetRandomResourceOptions
  ): Promise<WarhammerApiResponse<GetRandomResourceResponseBody>>;
  getResourceCatalog(
    options?: GetResourceCatalogOptions
  ): Promise<WarhammerApiResponse<GetResourceCatalogResponseBody>>;
  getResourceDetail(
    options: GetResourceDetailOptions
  ): Promise<WarhammerApiResponse<GetResourceDetailResponseBody>>;
  getResourceDocumentation(
    options: GetResourceDocumentationOptions
  ): Promise<WarhammerApiResponse<GetResourceDocumentationResponseBody>>;
  getStats(options: GetStatsOptions): Promise<WarhammerApiResponse<GetStatsResponseBody>>;
  getWorkbenchScenarios(
    options?: GetWorkbenchScenariosOptions
  ): Promise<WarhammerApiResponse<GetWorkbenchScenariosResponseBody>>;
  listResource(
    options: ListResourceOptions
  ): Promise<WarhammerApiResponse<ListResourceResponseBody>>;
  searchResources(
    options: SearchResourcesOptions
  ): Promise<WarhammerApiResponse<SearchResourcesResponseBody>>;
}

export declare const operations: WarhammerOperationsMap;

export declare function buildUrl(
  baseUrl: string,
  pathTemplate: string,
  pathParams?: Record<string, unknown>,
  query?: Record<string, unknown>
): string;

export declare function createWarhammerApiClient(options?: {
  baseUrl?: string;
  fetchImpl?: WarhammerFetchLike;
}): WarhammerApiClient;
