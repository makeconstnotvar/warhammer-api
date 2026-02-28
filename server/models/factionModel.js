class Faction {
    constructor({id, slug, name, summary, description, status, alignment, power_level, race_id, image_url, created_at, updated_at}) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.summary = summary;
        this.description = description;
        this.status = status;
        this.alignment = alignment;
        this.powerLevel = power_level;
        this.raceId = race_id;
        this.imageUrl = image_url;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }
}

module.exports = Faction;
