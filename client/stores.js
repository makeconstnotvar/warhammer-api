import {FactionsStore} from './stores/factionsStore';
import {RacesStore} from "./stores/racesStore";
import {CharactersStore} from "./stores/charactersStore";
import {RaceStore} from "./stores/raceStore";

const stores = {
  $factionsStore: new FactionsStore(),
  $racesStore: new RacesStore(),
  $raceStore: new RaceStore(),
  $charactersStore: new CharactersStore(),
}

export {stores}