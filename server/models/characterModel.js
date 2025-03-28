class CharacterModel {
    constructor({id, name, description, faction_id, race_id, image_url, created_at, updated_at}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.factionId = faction_id;
        this.raceId = race_id;
        this.imageUrl = image_url;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }
}

module.exports = CharacterModel;