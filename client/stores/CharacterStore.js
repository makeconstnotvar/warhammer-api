import {action, observable} from 'mobx';

class CharacterStore {
  @observable data = [];
  @observable error = null;

  @action
  fetchData() {
    const response = fetch('/api/characters')
      .then((response) => response.json()).then((data) => {
        this.data = data;
      })
      .catch((error) => {
        this.error = error.message;
      });
  }
}

export {CharacterStore};