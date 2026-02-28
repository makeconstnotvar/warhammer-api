BEGIN;

CREATE TABLE IF NOT EXISTS keywords (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weapons (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  weapon_type TEXT NOT NULL DEFAULT 'unknown',
  power_level INTEGER NOT NULL DEFAULT 0,
  faction_id BIGINT REFERENCES factions(id) ON DELETE SET NULL,
  era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weapon_keywords (
  weapon_id BIGINT NOT NULL REFERENCES weapons(id) ON DELETE CASCADE,
  keyword_id BIGINT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (weapon_id, keyword_id)
);

CREATE TABLE IF NOT EXISTS units (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  unit_type TEXT NOT NULL DEFAULT 'unknown',
  power_level INTEGER NOT NULL DEFAULT 0,
  era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unit_factions (
  unit_id BIGINT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  faction_id BIGINT NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (unit_id, faction_id)
);

CREATE TABLE IF NOT EXISTS unit_keywords (
  unit_id BIGINT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  keyword_id BIGINT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (unit_id, keyword_id)
);

CREATE TABLE IF NOT EXISTS unit_weapons (
  unit_id BIGINT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  weapon_id BIGINT NOT NULL REFERENCES weapons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (unit_id, weapon_id)
);

CREATE INDEX IF NOT EXISTS idx_keywords_category ON keywords(category);
CREATE INDEX IF NOT EXISTS idx_weapons_status ON weapons(status);
CREATE INDEX IF NOT EXISTS idx_weapons_weapon_type ON weapons(weapon_type);
CREATE INDEX IF NOT EXISTS idx_weapons_faction_id ON weapons(faction_id);
CREATE INDEX IF NOT EXISTS idx_weapons_era_id ON weapons(era_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_units_unit_type ON units(unit_type);
CREATE INDEX IF NOT EXISTS idx_units_era_id ON units(era_id);

DROP TRIGGER IF EXISTS keywords_set_updated_at ON keywords;
CREATE TRIGGER keywords_set_updated_at
BEFORE UPDATE ON keywords
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS weapons_set_updated_at ON weapons;
CREATE TRIGGER weapons_set_updated_at
BEFORE UPDATE ON weapons
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS units_set_updated_at ON units;
CREATE TRIGGER units_set_updated_at
BEFORE UPDATE ON units
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
