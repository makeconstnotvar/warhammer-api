import {FactionStore} from './stores/FactionStore';
import {RaceStore} from "./stores/RaceStore";
import {CharacterStore} from "./stores/CharacterStore";

const stores = {
    $factionStore: new FactionStore(),
    $raceStore: new RaceStore(),
    $characterStore: new CharacterStore(),
}

export {stores}