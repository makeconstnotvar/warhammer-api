import {factionsApi} from "../api/factionsApi";
import {withFetchArray} from "./utils/fetchArray";

@withFetchArray
class FactionsStore {
  fetchMethod = factionsApi.getFactions
}

export {FactionsStore};