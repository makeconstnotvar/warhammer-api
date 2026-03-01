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
        id, slug, name, summary, description, status, type, sector, era_id, star_system_id, keywords, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
        planet.starSystemId || null,
        planet.keywords,
        null,
      ]
    );
  }
}

async function insertStarSystems(client) {
  for (const starSystem of dataset.starSystems) {
    await client.query(
      `INSERT INTO star_systems (
        id, slug, name, summary, description, status, segmentum, era_id, keywords, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        starSystem.id,
        starSystem.slug,
        starSystem.name,
        starSystem.summary,
        starSystem.description,
        starSystem.status,
        starSystem.segmentum,
        starSystem.eraId || null,
        starSystem.keywords,
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

async function insertKeywords(client) {
  for (const keyword of dataset.keywords) {
    await client.query(
      `INSERT INTO keywords (
        id, slug, name, description, category
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        keyword.id,
        keyword.slug,
        keyword.name,
        keyword.description,
        keyword.category,
      ]
    );
  }
}

async function insertWeapons(client) {
  for (const weapon of dataset.weapons) {
    await client.query(
      `INSERT INTO weapons (
        id, slug, name, summary, description, status, weapon_type, power_level, faction_id, era_id, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        weapon.id,
        weapon.slug,
        weapon.name,
        weapon.summary,
        weapon.description,
        weapon.status,
        weapon.weaponType,
        weapon.powerLevel,
        weapon.factionId || null,
        weapon.eraId || null,
        null,
      ]
    );

    for (const keywordId of weapon.keywordIds || []) {
      await client.query(
        'INSERT INTO weapon_keywords (weapon_id, keyword_id) VALUES ($1, $2)',
        [weapon.id, keywordId]
      );
    }
  }
}

async function insertUnits(client) {
  for (const unit of dataset.units) {
    await client.query(
      `INSERT INTO units (
        id, slug, name, summary, description, status, unit_type, power_level, era_id, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        unit.id,
        unit.slug,
        unit.name,
        unit.summary,
        unit.description,
        unit.status,
        unit.unitType,
        unit.powerLevel,
        unit.eraId || null,
        null,
      ]
    );

    for (const factionId of unit.factionIds || []) {
      await client.query(
        'INSERT INTO unit_factions (unit_id, faction_id, is_primary) VALUES ($1, $2, $3)',
        [unit.id, factionId, factionId === unit.factionIds[0]]
      );
    }

    for (const keywordId of unit.keywordIds || []) {
      await client.query(
        'INSERT INTO unit_keywords (unit_id, keyword_id) VALUES ($1, $2)',
        [unit.id, keywordId]
      );
    }

    for (const weaponId of unit.weaponIds || []) {
      await client.query(
        'INSERT INTO unit_weapons (unit_id, weapon_id) VALUES ($1, $2)',
        [unit.id, weaponId]
      );
    }
  }
}

async function insertOrganizations(client) {
  for (const organization of dataset.organizations) {
    await client.query(
      `INSERT INTO organizations (
        id, slug, name, summary, description, status, organization_type, influence_level, homeworld_id, era_id, keywords, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        organization.id,
        organization.slug,
        organization.name,
        organization.summary,
        organization.description,
        organization.status,
        organization.organizationType,
        organization.influenceLevel,
        organization.homeworldId || null,
        organization.eraId || null,
        organization.keywords,
        null,
      ]
    );

    for (const factionId of organization.factionIds || []) {
      await client.query(
        'INSERT INTO organization_factions (organization_id, faction_id, is_primary) VALUES ($1, $2, $3)',
        [organization.id, factionId, factionId === organization.factionIds[0]]
      );
    }

    for (const leaderId of organization.leaderIds || []) {
      await client.query(
        'INSERT INTO organization_leaders (organization_id, character_id) VALUES ($1, $2)',
        [organization.id, leaderId]
      );
    }
  }
}

async function insertRelics(client) {
  for (const relic of dataset.relics) {
    await client.query(
      `INSERT INTO relics (
        id, slug, name, summary, description, status, relic_type, power_level, faction_id, bearer_character_id, origin_planet_id, era_id, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        relic.id,
        relic.slug,
        relic.name,
        relic.summary,
        relic.description,
        relic.status,
        relic.relicType,
        relic.powerLevel,
        relic.factionId || null,
        relic.bearerCharacterId || null,
        relic.originPlanetId || null,
        relic.eraId || null,
        null,
      ]
    );

    for (const keywordId of relic.keywordIds || []) {
      await client.query(
        'INSERT INTO relic_keywords (relic_id, keyword_id) VALUES ($1, $2)',
        [relic.id, keywordId]
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

async function insertCampaigns(client) {
  for (const campaign of dataset.campaigns) {
    await client.query(
      `INSERT INTO campaigns (
        id, slug, name, summary, description, status, campaign_type, era_id, year_label, year_order, keywords, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        campaign.id,
        campaign.slug,
        campaign.name,
        campaign.summary,
        campaign.description,
        campaign.status,
        campaign.campaignType,
        campaign.eraId || null,
        campaign.yearLabel,
        campaign.yearOrder,
        campaign.keywords,
        null,
      ]
    );

    for (const planetId of campaign.planetIds || []) {
      await client.query(
        'INSERT INTO campaign_planets (campaign_id, planet_id, is_primary) VALUES ($1, $2, $3)',
        [campaign.id, planetId, planetId === campaign.planetIds[0]]
      );
    }

    for (const factionId of campaign.factionIds || []) {
      await client.query(
        'INSERT INTO campaign_factions (campaign_id, faction_id) VALUES ($1, $2)',
        [campaign.id, factionId]
      );
    }

    for (const characterId of campaign.characterIds || []) {
      await client.query(
        'INSERT INTO campaign_characters (campaign_id, character_id) VALUES ($1, $2)',
        [campaign.id, characterId]
      );
    }

    for (const organizationId of campaign.organizationIds || []) {
      await client.query(
        'INSERT INTO campaign_organizations (campaign_id, organization_id) VALUES ($1, $2)',
        [campaign.id, organizationId]
      );
    }
  }
}

async function insertBattlefields(client) {
  for (const battlefield of dataset.battlefields) {
    await client.query(
      `INSERT INTO battlefields (
        id, slug, name, summary, description, status, battlefield_type, terrain, intensity_level, planet_id, star_system_id, era_id, keywords, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        battlefield.id,
        battlefield.slug,
        battlefield.name,
        battlefield.summary,
        battlefield.description,
        battlefield.status,
        battlefield.battlefieldType,
        battlefield.terrain,
        battlefield.intensityLevel,
        battlefield.planetId || null,
        battlefield.starSystemId || null,
        battlefield.eraId || null,
        battlefield.keywords,
        null,
      ]
    );

    for (const factionId of battlefield.factionIds || []) {
      await client.query(
        'INSERT INTO battlefield_factions (battlefield_id, faction_id) VALUES ($1, $2)',
        [battlefield.id, factionId]
      );
    }

    for (const characterId of battlefield.characterIds || []) {
      await client.query(
        'INSERT INTO battlefield_characters (battlefield_id, character_id) VALUES ($1, $2)',
        [battlefield.id, characterId]
      );
    }

    for (const campaignId of battlefield.campaignIds || []) {
      await client.query(
        'INSERT INTO battlefield_campaigns (battlefield_id, campaign_id) VALUES ($1, $2)',
        [battlefield.id, campaignId]
      );
    }
  }
}

async function resetSequences(client) {
  await client.query(`
    SELECT setval(pg_get_serial_sequence('eras', 'id'), COALESCE(MAX(id), 1), true) FROM eras;
    SELECT setval(pg_get_serial_sequence('races', 'id'), COALESCE(MAX(id), 1), true) FROM races;
    SELECT setval(pg_get_serial_sequence('star_systems', 'id'), COALESCE(MAX(id), 1), true) FROM star_systems;
    SELECT setval(pg_get_serial_sequence('planets', 'id'), COALESCE(MAX(id), 1), true) FROM planets;
    SELECT setval(pg_get_serial_sequence('factions', 'id'), COALESCE(MAX(id), 1), true) FROM factions;
    SELECT setval(pg_get_serial_sequence('organizations', 'id'), COALESCE(MAX(id), 1), true) FROM organizations;
    SELECT setval(pg_get_serial_sequence('keywords', 'id'), COALESCE(MAX(id), 1), true) FROM keywords;
    SELECT setval(pg_get_serial_sequence('weapons', 'id'), COALESCE(MAX(id), 1), true) FROM weapons;
    SELECT setval(pg_get_serial_sequence('relics', 'id'), COALESCE(MAX(id), 1), true) FROM relics;
    SELECT setval(pg_get_serial_sequence('units', 'id'), COALESCE(MAX(id), 1), true) FROM units;
    SELECT setval(pg_get_serial_sequence('characters', 'id'), COALESCE(MAX(id), 1), true) FROM characters;
    SELECT setval(pg_get_serial_sequence('character_titles', 'id'), COALESCE(MAX(id), 1), true) FROM character_titles;
    SELECT setval(pg_get_serial_sequence('events', 'id'), COALESCE(MAX(id), 1), true) FROM events;
    SELECT setval(pg_get_serial_sequence('campaigns', 'id'), COALESCE(MAX(id), 1), true) FROM campaigns;
    SELECT setval(pg_get_serial_sequence('battlefields', 'id'), COALESCE(MAX(id), 1), true) FROM battlefields;
  `);
}

async function run() {
  const client = createClient();

  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      TRUNCATE TABLE
        campaign_organizations,
        campaign_characters,
        campaign_factions,
        campaign_planets,
        battlefield_campaigns,
        battlefield_characters,
        battlefield_factions,
        event_characters,
        event_factions,
        event_planets,
        relic_keywords,
        organization_leaders,
        organization_factions,
        unit_weapons,
        unit_keywords,
        unit_factions,
        weapon_keywords,
        faction_leaders,
        character_titles,
        faction_races,
        campaigns,
        battlefields,
        relics,
        organizations,
        units,
        weapons,
        keywords,
        events,
        characters,
        factions,
        planets,
        star_systems,
        races,
        eras
      RESTART IDENTITY CASCADE
    `);

    await insertEras(client);
    await insertRaces(client);
    await insertStarSystems(client);
    await insertPlanets(client);
    await insertFactions(client);
    await insertKeywords(client);
    await insertWeapons(client);
    await insertUnits(client);
    await insertCharacters(client);
    await insertOrganizations(client);
    await insertRelics(client);
    await insertEvents(client);
    await insertCampaigns(client);
    await insertBattlefields(client);
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
