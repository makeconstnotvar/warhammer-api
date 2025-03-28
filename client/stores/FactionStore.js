import { makeAutoObservable } from 'mobx';

class FactionStore {
    factions = [];
    error = null;

    constructor() {
        makeAutoObservable(this);
        this.fetchFactions();
    }

    async fetchFactions() {
        try {
            const response = await fetch('/api/factions');
            const data = await response.json();
            this.factions = data;
        } catch (err) {
            this.error = err.message;
        }
    }
}

export { FactionStore };