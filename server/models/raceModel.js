class Race {
    constructor({id, name, description, image_url, created_at, updated_at}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.imageUrl = image_url;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }
}

module.exports = Race;