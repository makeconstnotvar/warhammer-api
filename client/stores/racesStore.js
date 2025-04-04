import {racesApi} from "../api/racesApi";
import {withFetchArray} from "./utils/createDecorator";

@withFetchArray
class RacesStore {
  fetchMethod = racesApi.getRaces
}

export {RacesStore};