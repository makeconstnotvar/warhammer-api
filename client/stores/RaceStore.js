import BaseStore from "./BaseStore";
import {racesApi} from "../api/racesApi";

class RaceStore extends BaseStore {
  fetchMethod = racesApi.getRaces
}

export {RaceStore};