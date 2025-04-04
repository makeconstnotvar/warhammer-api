import {racesApi} from "../api/racesApi";
import {withFetchObject} from "./utils/createDecorator";

@withFetchObject
class RaceStore {
  fetchMethod = racesApi.getRaceById
}

export {RaceStore};