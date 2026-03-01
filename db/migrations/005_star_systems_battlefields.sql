BEGIN;

CREATE TABLE IF NOT EXISTS star_systems (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  segmentum TEXT NOT NULL DEFAULT '',
  era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  keywords TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE planets
  ADD COLUMN IF NOT EXISTS star_system_id BIGINT REFERENCES star_systems(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS battlefields (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  battlefield_type TEXT NOT NULL DEFAULT 'warzone',
  terrain TEXT NOT NULL DEFAULT '',
  intensity_level INTEGER NOT NULL DEFAULT 0,
  planet_id BIGINT REFERENCES planets(id) ON DELETE SET NULL,
  star_system_id BIGINT REFERENCES star_systems(id) ON DELETE SET NULL,
  era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  keywords TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS battlefield_factions (
  battlefield_id BIGINT NOT NULL REFERENCES battlefields(id) ON DELETE CASCADE,
  faction_id BIGINT NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (battlefield_id, faction_id)
);

CREATE TABLE IF NOT EXISTS battlefield_characters (
  battlefield_id BIGINT NOT NULL REFERENCES battlefields(id) ON DELETE CASCADE,
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (battlefield_id, character_id)
);

CREATE TABLE IF NOT EXISTS battlefield_campaigns (
  battlefield_id BIGINT NOT NULL REFERENCES battlefields(id) ON DELETE CASCADE,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (battlefield_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_star_systems_status ON star_systems(status);
CREATE INDEX IF NOT EXISTS idx_star_systems_segmentum ON star_systems(segmentum);
CREATE INDEX IF NOT EXISTS idx_star_systems_era_id ON star_systems(era_id);
CREATE INDEX IF NOT EXISTS idx_planets_star_system_id ON planets(star_system_id);
CREATE INDEX IF NOT EXISTS idx_battlefields_status ON battlefields(status);
CREATE INDEX IF NOT EXISTS idx_battlefields_type ON battlefields(battlefield_type);
CREATE INDEX IF NOT EXISTS idx_battlefields_terrain ON battlefields(terrain);
CREATE INDEX IF NOT EXISTS idx_battlefields_intensity_level ON battlefields(intensity_level);
CREATE INDEX IF NOT EXISTS idx_battlefields_planet_id ON battlefields(planet_id);
CREATE INDEX IF NOT EXISTS idx_battlefields_star_system_id ON battlefields(star_system_id);
CREATE INDEX IF NOT EXISTS idx_battlefields_era_id ON battlefields(era_id);

DROP TRIGGER IF EXISTS star_systems_set_updated_at ON star_systems;
CREATE TRIGGER star_systems_set_updated_at
BEFORE UPDATE ON star_systems
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS battlefields_set_updated_at ON battlefields;
CREATE TRIGGER battlefields_set_updated_at
BEFORE UPDATE ON battlefields
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
