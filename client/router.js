import {Home} from "./pages/Home";
import {ErrorBoundary, LocationProvider, Router} from "preact-iso";
import {h} from "preact";
import {RaceList} from "./pages/RaceList";
import {FactionList} from "./pages/FactionList";
import {CharacterList} from "./pages/CharacterList";
import {NotFound} from "./pages/NotFound";

const Routes = () => (
  <LocationProvider>
    <ErrorBoundary>
      <Router>
        <Home path="/"/>
        <RaceList path="/races"/>
        <FactionList path="/factions"/>
        <CharacterList path="/characters"/>
        <NotFound default/>
      </Router>
    </ErrorBoundary>
  </LocationProvider>
)
export {Routes};