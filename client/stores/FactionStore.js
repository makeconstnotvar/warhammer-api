import {action, makeObservable, observable} from 'mobx';

class FactionStore {
  constructor() {
    makeObservable(this)
  }

  @observable accessor data = [];
  @observable accessor error = null;

  @action
  fetchData() {
    const response = fetch('/api/factions')
      .then((response) => response.json()).then((data) => {
        this.data = data;
      })
      .catch((error) => {
        this.error = error.message;
      });
  }
}

export {FactionStore};