class CharacterModel {
    constructor({
        id,
        slug,
        name,
        summary,
        description,
        status,
        alignment,
        power_level,
        faction_id,
        race_id,
        homeworld_id,
        era_id,
        image_url,
        created_at,
        updated_at
    }) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.summary = summary;
        this.description = description;
        this.status = status;
        this.alignment = alignment;
        this.powerLevel = power_level;
        this.factionId = faction_id;
        this.raceId = race_id;
        this.homeworldId = homeworld_id;
        this.eraId = era_id;
        this.imageUrl = image_url;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }
}

module.exports = CharacterModel;
