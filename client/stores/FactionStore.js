import {action, makeAutoObservable, observable} from 'mobx';

class FactionStore {
    @observable factions = [];
    @observable  error = null;

    @action
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