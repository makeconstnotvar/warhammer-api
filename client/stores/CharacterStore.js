import BaseStore from "./BaseStore";
import {charactersApi} from "../api/charactersApi";

class CharacterStore extends BaseStore {
  fetchMethod = charactersApi.getCharacters
}

export {CharacterStore};