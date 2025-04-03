import {racesApi} from "../api/racesApi";
import {withFetchObject} from "./utils/fetchArray";

@withFetchObject
class RaceStore {
  fetchMethod = racesApi.getRaceById
}

export {RaceStore};