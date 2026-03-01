BEGIN;

CREATE TABLE IF NOT EXISTS fleets (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  fleet_type TEXT NOT NULL DEFAULT 'battlefleet',
  mobility_class TEXT NOT NULL DEFAULT 'line-fleet',
  strength_rating INTEGER NOT NULL DEFAULT 0,
  current_star_system_id BIGINT REFERENCES star_systems(id) ON DELETE SET NULL,
  home_port_planet_id BIGINT REFERENCES planets(id) ON DELETE SET NULL,
  era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  keywords TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fleet_factions (
  fleet_id BIGINT NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  faction_id BIGINT NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (fleet_id, faction_id)
);

CREATE TABLE IF NOT EXISTS fleet_commanders (
  fleet_id BIGINT NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (fleet_id, character_id)
);

CREATE TABLE IF NOT EXISTS fleet_campaigns (
  fleet_id BIGINT NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (fleet_id, campaign_id)
);

CREATE TABLE IF NOT EXISTS warp_routes (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  route_type TEXT NOT NULL DEFAULT 'corridor',
  stability_level INTEGER NOT NULL DEFAULT 0,
  transit_time_rating INTEGER NOT NULL DEFAULT 0,
  from_star_system_id BIGINT REFERENCES star_systems(id) ON DELETE SET NULL,
  to_star_system_id BIGINT REFERENCES star_systems(id) ON DELETE SET NULL,
  era_id BIGINT REFERENCES eras(id) ON DELETE SET NULL,
  keywords TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warp_route_factions (
  warp_route_id BIGINT NOT NULL REFERENCES warp_routes(id) ON DELETE CASCADE,
  faction_id BIGINT NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (warp_route_id, faction_id)
);

CREATE TABLE IF NOT EXISTS warp_route_campaigns (
  warp_route_id BIGINT NOT NULL REFERENCES warp_routes(id) ON DELETE CASCADE,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (warp_route_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_fleets_status ON fleets(status);
CREATE INDEX IF NOT EXISTS idx_fleets_type ON fleets(fleet_type);
CREATE INDEX IF NOT EXISTS idx_fleets_mobility_class ON fleets(mobility_class);
CREATE INDEX IF NOT EXISTS idx_fleets_strength_rating ON fleets(strength_rating);
CREATE INDEX IF NOT EXISTS idx_fleets_current_star_system_id ON fleets(current_star_system_id);
CREATE INDEX IF NOT EXISTS idx_fleets_home_port_planet_id ON fleets(home_port_planet_id);
CREATE INDEX IF NOT EXISTS idx_fleets_era_id ON fleets(era_id);

CREATE INDEX IF NOT EXISTS idx_warp_routes_status ON warp_routes(status);
CREATE INDEX IF NOT EXISTS idx_warp_routes_type ON warp_routes(route_type);
CREATE INDEX IF NOT EXISTS idx_warp_routes_stability_level ON warp_routes(stability_level);
CREATE INDEX IF NOT EXISTS idx_warp_routes_transit_time_rating ON warp_routes(transit_time_rating);
CREATE INDEX IF NOT EXISTS idx_warp_routes_from_star_system_id ON warp_routes(from_star_system_id);
CREATE INDEX IF NOT EXISTS idx_warp_routes_to_star_system_id ON warp_routes(to_star_system_id);
CREATE INDEX IF NOT EXISTS idx_warp_routes_era_id ON warp_routes(era_id);

DROP TRIGGER IF EXISTS fleets_set_updated_at ON fleets;
CREATE TRIGGER fleets_set_updated_at
BEFORE UPDATE ON fleets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS warp_routes_set_updated_at ON warp_routes;
CREATE TRIGGER warp_routes_set_updated_at
BEFORE UPDATE ON warp_routes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
