BEGIN;

CREATE TABLE IF NOT EXISTS organizations (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  organization_type TEXT NOT NULL DEFAULT 'institution',
  influence_level INTEGER NOT NULL DEFAULT 0,
  homeworld_id BIGINT REFERENCES planets(id) ON DELETE SET NULL,
  era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  keywords TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_factions (
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  faction_id BIGINT NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, faction_id)
);

CREATE TABLE IF NOT EXISTS organization_leaders (
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, character_id)
);

CREATE TABLE IF NOT EXISTS relics (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  relic_type TEXT NOT NULL DEFAULT 'artifact',
  power_level INTEGER NOT NULL DEFAULT 0,
  faction_id BIGINT REFERENCES factions(id) ON DELETE SET NULL,
  bearer_character_id BIGINT REFERENCES characters(id) ON DELETE SET NULL,
  origin_planet_id BIGINT REFERENCES planets(id) ON DELETE SET NULL,
  era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS relic_keywords (
  relic_id BIGINT NOT NULL REFERENCES relics(id) ON DELETE CASCADE,
  keyword_id BIGINT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (relic_id, keyword_id)
);

CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  campaign_type TEXT NOT NULL DEFAULT 'operation',
  era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  year_label TEXT NOT NULL DEFAULT '',
  year_order INTEGER NOT NULL DEFAULT 0,
  keywords TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_planets (
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  planet_id BIGINT NOT NULL REFERENCES planets(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (campaign_id, planet_id)
);

CREATE TABLE IF NOT EXISTS campaign_factions (
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  faction_id BIGINT NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (campaign_id, faction_id)
);

CREATE TABLE IF NOT EXISTS campaign_characters (
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (campaign_id, character_id)
);

CREATE TABLE IF NOT EXISTS campaign_organizations (
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (campaign_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(organization_type);
CREATE INDEX IF NOT EXISTS idx_organizations_homeworld_id ON organizations(homeworld_id);
CREATE INDEX IF NOT EXISTS idx_organizations_era_id ON organizations(era_id);
CREATE INDEX IF NOT EXISTS idx_relics_status ON relics(status);
CREATE INDEX IF NOT EXISTS idx_relics_type ON relics(relic_type);
CREATE INDEX IF NOT EXISTS idx_relics_faction_id ON relics(faction_id);
CREATE INDEX IF NOT EXISTS idx_relics_bearer_character_id ON relics(bearer_character_id);
CREATE INDEX IF NOT EXISTS idx_relics_origin_planet_id ON relics(origin_planet_id);
CREATE INDEX IF NOT EXISTS idx_relics_era_id ON relics(era_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_era_id ON campaigns(era_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_year_order ON campaigns(year_order);

DROP TRIGGER IF EXISTS organizations_set_updated_at ON organizations;
CREATE TRIGGER organizations_set_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS relics_set_updated_at ON relics;
CREATE TRIGGER relics_set_updated_at
BEFORE UPDATE ON relics
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS campaigns_set_updated_at ON campaigns;
CREATE TRIGGER campaigns_set_updated_at
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
