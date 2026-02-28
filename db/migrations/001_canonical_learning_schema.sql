BEGIN;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS eras (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  year_label TEXT,
  year_order INTEGER NOT NULL DEFAULT 0,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS races (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  alignment TEXT NOT NULL DEFAULT 'unknown',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planets (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  type TEXT,
  sector TEXT,
  era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS factions (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  alignment TEXT NOT NULL DEFAULT 'unknown',
  power_level INTEGER NOT NULL DEFAULT 0,
  parent_faction_id BIGINT REFERENCES factions(id) ON DELETE SET NULL,
  homeworld_id BIGINT REFERENCES planets(id) ON DELETE SET NULL,
  era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faction_races (
  faction_id BIGINT NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  race_id BIGINT NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (faction_id, race_id)
);

CREATE TABLE IF NOT EXISTS characters (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  rank TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  alignment TEXT NOT NULL DEFAULT 'unknown',
  power_level INTEGER NOT NULL DEFAULT 0,
  faction_id BIGINT REFERENCES factions(id) ON DELETE SET NULL,
  race_id BIGINT REFERENCES races(id) ON DELETE SET NULL,
  homeworld_id BIGINT REFERENCES planets(id) ON DELETE SET NULL,
  era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS character_titles (
  id BIGSERIAL PRIMARY KEY,
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faction_leaders (
  faction_id BIGINT NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (faction_id, character_id)
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  year_label TEXT,
  year_order INTEGER NOT NULL DEFAULT 0,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_planets (
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  planet_id BIGINT NOT NULL REFERENCES planets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, planet_id)
);

CREATE TABLE IF NOT EXISTS event_factions (
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  faction_id BIGINT NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, faction_id)
);

CREATE TABLE IF NOT EXISTS event_characters (
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, character_id)
);

ALTER TABLE IF EXISTS eras
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS year_label TEXT,
  ADD COLUMN IF NOT EXISTS year_order INTEGER,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE eras
SET
  slug = COALESCE(NULLIF(slug, ''), COALESCE(NULLIF(regexp_replace(regexp_replace(lower(trim(COALESCE(name, 'era'))), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'), ''), 'era') || '-' || id::text),
  summary = COALESCE(summary, COALESCE(description, '')),
  description = COALESCE(description, ''),
  status = COALESCE(status, 'active'),
  year_order = COALESCE(year_order, 0),
  keywords = COALESCE(keywords, '{}'),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW());

ALTER TABLE eras
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN summary SET NOT NULL,
  ALTER COLUMN summary SET DEFAULT '',
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN description SET DEFAULT '',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN year_order SET NOT NULL,
  ALTER COLUMN year_order SET DEFAULT 0,
  ALTER COLUMN keywords SET NOT NULL,
  ALTER COLUMN keywords SET DEFAULT '{}',
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE IF EXISTS races
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS alignment TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE races
SET
  slug = COALESCE(NULLIF(slug, ''), COALESCE(NULLIF(regexp_replace(regexp_replace(lower(trim(COALESCE(name, 'race'))), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'), ''), 'race') || '-' || id::text),
  summary = COALESCE(summary, COALESCE(description, '')),
  description = COALESCE(description, ''),
  status = COALESCE(status, 'active'),
  alignment = COALESCE(alignment, 'unknown'),
  keywords = COALESCE(keywords, '{}'),
  image_url = COALESCE(image_url, NULL),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW());

ALTER TABLE races
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN summary SET NOT NULL,
  ALTER COLUMN summary SET DEFAULT '',
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN description SET DEFAULT '',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN alignment SET NOT NULL,
  ALTER COLUMN alignment SET DEFAULT 'unknown',
  ALTER COLUMN keywords SET NOT NULL,
  ALTER COLUMN keywords SET DEFAULT '{}',
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE IF EXISTS planets
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';

UPDATE planets
SET
  summary = COALESCE(summary, COALESCE(description, '')),
  description = COALESCE(description, ''),
  status = COALESCE(status, 'active'),
  keywords = COALESCE(keywords, '{}'),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW());

ALTER TABLE planets
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN summary SET NOT NULL,
  ALTER COLUMN summary SET DEFAULT '',
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN description SET DEFAULT '',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN keywords SET NOT NULL,
  ALTER COLUMN keywords SET DEFAULT '{}',
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE IF EXISTS factions
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS alignment TEXT,
  ADD COLUMN IF NOT EXISTS power_level INTEGER,
  ADD COLUMN IF NOT EXISTS parent_faction_id BIGINT REFERENCES factions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS homeworld_id BIGINT REFERENCES planets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE factions
SET
  slug = COALESCE(NULLIF(slug, ''), COALESCE(NULLIF(regexp_replace(regexp_replace(lower(trim(COALESCE(name, 'faction'))), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'), ''), 'faction') || '-' || id::text),
  summary = COALESCE(summary, COALESCE(description, '')),
  description = COALESCE(description, ''),
  status = COALESCE(status, 'active'),
  alignment = COALESCE(alignment, 'unknown'),
  power_level = COALESCE(power_level, 0),
  keywords = COALESCE(keywords, '{}'),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW());

ALTER TABLE factions
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN summary SET NOT NULL,
  ALTER COLUMN summary SET DEFAULT '',
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN description SET DEFAULT '',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN alignment SET NOT NULL,
  ALTER COLUMN alignment SET DEFAULT 'unknown',
  ALTER COLUMN power_level SET NOT NULL,
  ALTER COLUMN power_level SET DEFAULT 0,
  ALTER COLUMN keywords SET NOT NULL,
  ALTER COLUMN keywords SET DEFAULT '{}',
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE IF EXISTS characters
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS alignment TEXT,
  ADD COLUMN IF NOT EXISTS power_level INTEGER,
  ADD COLUMN IF NOT EXISTS faction_id BIGINT REFERENCES factions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS race_id BIGINT REFERENCES races(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS homeworld_id BIGINT REFERENCES planets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE characters
SET
  slug = COALESCE(NULLIF(slug, ''), COALESCE(NULLIF(regexp_replace(regexp_replace(lower(trim(COALESCE(name, 'character'))), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'), ''), 'character') || '-' || id::text),
  summary = COALESCE(summary, COALESCE(description, '')),
  description = COALESCE(description, ''),
  status = COALESCE(status, 'active'),
  alignment = COALESCE(alignment, 'unknown'),
  power_level = COALESCE(power_level, 0),
  keywords = COALESCE(keywords, '{}'),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW());

ALTER TABLE characters
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN summary SET NOT NULL,
  ALTER COLUMN summary SET DEFAULT '',
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN description SET DEFAULT '',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN alignment SET NOT NULL,
  ALTER COLUMN alignment SET DEFAULT 'unknown',
  ALTER COLUMN power_level SET NOT NULL,
  ALTER COLUMN power_level SET DEFAULT 0,
  ALTER COLUMN keywords SET NOT NULL,
  ALTER COLUMN keywords SET DEFAULT '{}',
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE IF EXISTS events
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';

UPDATE events
SET
  summary = COALESCE(summary, COALESCE(description, '')),
  description = COALESCE(description, ''),
  status = COALESCE(status, 'active'),
  year_order = COALESCE(year_order, 0),
  keywords = COALESCE(keywords, '{}'),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW());

ALTER TABLE events
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN summary SET NOT NULL,
  ALTER COLUMN summary SET DEFAULT '',
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN description SET DEFAULT '',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN year_order SET NOT NULL,
  ALTER COLUMN year_order SET DEFAULT 0,
  ALTER COLUMN keywords SET NOT NULL,
  ALTER COLUMN keywords SET DEFAULT '{}',
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_eras_status ON eras(status);
CREATE INDEX IF NOT EXISTS idx_eras_year_order ON eras(year_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_eras_slug_unique ON eras(slug);
CREATE INDEX IF NOT EXISTS idx_races_status ON races(status);
CREATE INDEX IF NOT EXISTS idx_races_alignment ON races(alignment);
CREATE UNIQUE INDEX IF NOT EXISTS idx_races_slug_unique ON races(slug);
CREATE INDEX IF NOT EXISTS idx_planets_status ON planets(status);
CREATE INDEX IF NOT EXISTS idx_planets_type ON planets(type);
CREATE INDEX IF NOT EXISTS idx_planets_era_id ON planets(era_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_planets_slug_unique ON planets(slug);
CREATE INDEX IF NOT EXISTS idx_factions_status ON factions(status);
CREATE INDEX IF NOT EXISTS idx_factions_alignment ON factions(alignment);
CREATE INDEX IF NOT EXISTS idx_factions_power_level ON factions(power_level);
CREATE INDEX IF NOT EXISTS idx_factions_homeworld_id ON factions(homeworld_id);
CREATE INDEX IF NOT EXISTS idx_factions_era_id ON factions(era_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_factions_slug_unique ON factions(slug);
CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(status);
CREATE INDEX IF NOT EXISTS idx_characters_alignment ON characters(alignment);
CREATE INDEX IF NOT EXISTS idx_characters_power_level ON characters(power_level);
CREATE INDEX IF NOT EXISTS idx_characters_faction_id ON characters(faction_id);
CREATE INDEX IF NOT EXISTS idx_characters_race_id ON characters(race_id);
CREATE INDEX IF NOT EXISTS idx_characters_homeworld_id ON characters(homeworld_id);
CREATE INDEX IF NOT EXISTS idx_characters_era_id ON characters(era_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_slug_unique ON characters(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_era_id ON events(era_id);
CREATE INDEX IF NOT EXISTS idx_events_year_order ON events(year_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug_unique ON events(slug);

DROP TRIGGER IF EXISTS eras_set_updated_at ON eras;
CREATE TRIGGER eras_set_updated_at
BEFORE UPDATE ON eras
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS races_set_updated_at ON races;
CREATE TRIGGER races_set_updated_at
BEFORE UPDATE ON races
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS planets_set_updated_at ON planets;
CREATE TRIGGER planets_set_updated_at
BEFORE UPDATE ON planets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS factions_set_updated_at ON factions;
CREATE TRIGGER factions_set_updated_at
BEFORE UPDATE ON factions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS characters_set_updated_at ON characters;
CREATE TRIGGER characters_set_updated_at
BEFORE UPDATE ON characters
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS events_set_updated_at ON events;
CREATE TRIGGER events_set_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
