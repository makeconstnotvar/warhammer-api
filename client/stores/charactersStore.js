import {charactersApi} from "../api/charactersApi";
import {withFetchArray} from "./utils/fetchArray";

@withFetchArray
class CharactersStore {
  fetchMethod = charactersApi.getCharacters;
  
  // Добавляем пользовательский метод для демонстрации
  getCharacterById(id) {
    return this.data.find(character => character.id === id);
  }
}

export {CharactersStore};