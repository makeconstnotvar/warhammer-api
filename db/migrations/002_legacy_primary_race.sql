BEGIN;

ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS race_id BIGINT REFERENCES races(id) ON DELETE SET NULL;

UPDATE factions AS f
SET race_id = source.race_id
FROM (
  SELECT DISTINCT ON (faction_id)
    faction_id,
    race_id
  FROM faction_races
  ORDER BY faction_id, is_primary DESC, race_id ASC
) AS source
WHERE f.id = source.faction_id
  AND f.race_id IS NULL;

ALTER TABLE factions
  ALTER COLUMN race_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_factions_race_id ON factions(race_id);

COMMIT;
