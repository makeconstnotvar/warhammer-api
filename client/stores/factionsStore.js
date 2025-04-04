import {factionsApi} from "../api/factionsApi";
import {withFetchArray} from "./utils/createDecorator";

@withFetchArray
class FactionsStore {
  fetchMethod = factionsApi.getFactions
}

export {FactionsStore};