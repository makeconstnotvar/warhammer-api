import {racesApi} from "../api/racesApi";
import {withFetchArray} from "./utils/fetchArray";

@withFetchArray
class RaceStore  {
  fetchMethod = racesApi.getRaces
}

export {RaceStore};