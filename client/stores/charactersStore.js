import {charactersApi} from "../api/charactersApi";
import {withFetchArray, withFetchObject} from "./utils/createDecorator";

@withFetchArray
class CharactersStore {
  fetchMethod = charactersApi.getCharacters;
}

export {CharactersStore};