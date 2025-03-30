import {action, makeObservable, observable} from 'mobx';

class RaceStore {
  constructor() {
    makeObservable(this)
  }

  @observable data = [];
  @observable error = null;

  @action
  fetchData() {
    const response = fetch('/api/races/')
      .then((response) => response.json())
      .then(action((data) => {
        this.data = data;
      }))
      .catch((error) => {
        this.error = error.message;
      });
  }
}

export {RaceStore};