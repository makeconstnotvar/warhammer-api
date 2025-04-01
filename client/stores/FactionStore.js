import BaseStore from "./BaseStore";
import {factionsApi} from "../api/factionsApi";

class FactionStore extends BaseStore {
  fetchMethod = factionsApi.getFactions
}

export {FactionStore};