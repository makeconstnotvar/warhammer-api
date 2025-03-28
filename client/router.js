import {Home} from "./pages/Home";
import {FactionList} from "./pages/Factions";
import {Router} from "preact-router";
import {h} from "preact";

const Routes = () => (<Router>
        <Home path="/"/>
        <FactionList path="/factions"/>
    </Router>
)
export {Routes};