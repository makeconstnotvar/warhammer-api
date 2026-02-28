const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('../scripts/_db');
const { dataset } = require('../../server/content/warhammerContent');

dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

async function insertEras(client) {
  for (const era of dataset.eras) {
    await client.query(
      `INSERT INTO eras (
        id, slug, name, summary, description, status, year_label, year_order, keywords, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        era.id,
        era.slug,
        era.name,
        era.summary,
        era.description,
        era.status,
        era.yearLabel,
        era.yearOrder,
        era.keywords,
        null,
      ]
    );
  }
}

async function insertRaces(client) {
  for (const race of dataset.races) {
    await client.query(
      `INSERT INTO races (
        id, slug, name, summary, description, status, alignment, keywords, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        race.id,
        race.slug,
        race.name,
        race.summary,
        race.description,
        race.status,
        race.alignment,
        race.keywords,
        null,
      ]
    );
  }
}

async function insertPlanets(client) {
  for (const planet of dataset.planets) {
    await client.query(
      `INSERT INTO planets (
        id, slug, name, summary, description, status, type, sector, era_id, keywords, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        planet.id,
        planet.slug,
        planet.name,
        planet.summary,
        planet.description,
        planet.status,
        planet.type,
        planet.sector,
        planet.eraId || null,
        planet.keywords,
        null,
      ]
    );
  }
}

async function insertFactions(client) {
  for (const faction of dataset.factions) {
    await client.query(
      `INSERT INTO factions (
        id, slug, name, summary, description, status, alignment, power_level, parent_faction_id, homeworld_id, era_id, race_id, keywords, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        faction.id,
        faction.slug,
        faction.name,
        faction.summary,
        faction.description,
        faction.status,
        faction.alignment,
        faction.powerLevel,
        faction.parentFactionId || null,
        faction.homeworldId || null,
        faction.eraId || null,
        faction.raceIds?.[0] || null,
        faction.keywords,
        null,
      ]
    );
  }

  for (const faction of dataset.factions) {
    for (const raceId of faction.raceIds || []) {
      await client.query(
        'INSERT INTO faction_races (faction_id, race_id, is_primary) VALUES ($1, $2, $3)',
        [faction.id, raceId, raceId === faction.raceIds[0]]
      );
    }
  }
}

async function insertCharacters(client) {
  for (const character of dataset.characters) {
    await client.query(
      `INSERT INTO characters (
        id, slug, name, summary, description, rank, status, alignment, power_level, faction_id, race_id, homeworld_id, era_id, keywords, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        character.id,
        character.slug,
        character.name,
        character.summary,
        character.description,
        character.titles?.[0] || null,
        character.status,
        character.alignment,
        character.powerLevel,
        character.factionId || null,
        character.raceId || null,
        character.homeworldId || null,
        character.eraId || null,
        character.keywords,
        null,
      ]
    );

    for (const [index, title] of (character.titles || []).entries()) {
      await client.query(
        'INSERT INTO character_titles (character_id, title, sort_order) VALUES ($1, $2, $3)',
        [character.id, title, index]
      );
    }
  }

  for (const faction of dataset.factions) {
    for (const leaderId of faction.leaderIds || []) {
      await client.query(
        'INSERT INTO faction_leaders (faction_id, character_id) VALUES ($1, $2)',
        [faction.id, leaderId]
      );
    }
  }
}

async function insertEvents(client) {
  for (const event of dataset.events) {
    await client.query(
      `INSERT INTO events (
        id, slug, name, summary, description, status, era_id, year_label, year_order, keywords, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        event.id,
        event.slug,
        event.name,
        event.summary,
        event.description,
        event.status,
        event.eraId || null,
        event.yearLabel,
        event.yearOrder,
        event.keywords,
        null,
      ]
    );

    for (const planetId of event.planetIds || []) {
      await client.query('INSERT INTO event_planets (event_id, planet_id) VALUES ($1, $2)', [event.id, planetId]);
    }

    for (const factionId of event.factionIds || []) {
      await client.query('INSERT INTO event_factions (event_id, faction_id) VALUES ($1, $2)', [event.id, factionId]);
    }

    for (const characterId of event.characterIds || []) {
      await client.query('INSERT INTO event_characters (event_id, character_id) VALUES ($1, $2)', [event.id, characterId]);
    }
  }
}

async function resetSequences(client) {
  await client.query(`
    SELECT setval(pg_get_serial_sequence('eras', 'id'), COALESCE(MAX(id), 1), true) FROM eras;
    SELECT setval(pg_get_serial_sequence('races', 'id'), COALESCE(MAX(id), 1), true) FROM races;
    SELECT setval(pg_get_serial_sequence('planets', 'id'), COALESCE(MAX(id), 1), true) FROM planets;
    SELECT setval(pg_get_serial_sequence('factions', 'id'), COALESCE(MAX(id), 1), true) FROM factions;
    SELECT setval(pg_get_serial_sequence('characters', 'id'), COALESCE(MAX(id), 1), true) FROM characters;
    SELECT setval(pg_get_serial_sequence('character_titles', 'id'), COALESCE(MAX(id), 1), true) FROM character_titles;
    SELECT setval(pg_get_serial_sequence('events', 'id'), COALESCE(MAX(id), 1), true) FROM events;
  `);
}

async function run() {
  const client = createClient();

  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      TRUNCATE TABLE
        event_characters,
        event_factions,
        event_planets,
        faction_leaders,
        character_titles,
        faction_races,
        events,
        characters,
        factions,
        planets,
        races,
        eras
      RESTART IDENTITY CASCADE
    `);

    await insertEras(client);
    await insertRaces(client);
    await insertPlanets(client);
    await insertFactions(client);
    await insertCharacters(client);
    await insertEvents(client);
    await resetSequences(client);
    await client.query('COMMIT');
    console.log('seed complete');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
