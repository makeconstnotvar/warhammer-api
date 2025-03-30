import {action, observable} from 'mobx';

class RaceStore {
  @observable data = [];
  @observable error = null;

  @action
  fetchData() {
    const response = fetch('/api/races/')
      .then((response) => response.json()).then((data) => {
        this.data = data;
      })
      .catch((error) => {
        this.error = error.message;
      });
  }
}

export {RaceStore};