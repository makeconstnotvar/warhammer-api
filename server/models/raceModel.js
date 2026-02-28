class Race {
    constructor({id, slug, name, summary, description, status, alignment, image_url, created_at, updated_at}) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.summary = summary;
        this.description = description;
        this.status = status;
        this.alignment = alignment;
        this.imageUrl = image_url;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }
}

module.exports = Race;
