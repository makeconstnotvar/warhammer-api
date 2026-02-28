import {Home} from "./pages/Home";
import {ErrorBoundary, LocationProvider, Router} from "preact-iso";
import {NotFound} from "./pages/NotFound";
import { QuickStart } from "./pages/QuickStart";
import { Resources } from "./pages/Resources";
import { ResourcePage } from "./pages/ResourcePage";
import { QueryGuide } from "./pages/QueryGuide";
import { Playground } from "./pages/Playground";
import { ConcurrencyPage } from "./pages/ConcurrencyPage";

const Routes = () => (
  <LocationProvider>
    <ErrorBoundary>
      <Router>
        <Home path="/"/>
        <QuickStart path="/quick-start"/>
        <Resources path="/resources"/>
        <ResourcePage path="/resources/:resource"/>
        <QueryGuide path="/query-guide"/>
        <Playground path="/playground"/>
        <ConcurrencyPage path="/examples/concurrency"/>
        <NotFound default/>
      </Router>
    </ErrorBoundary>
  </LocationProvider>
)
export {Routes};
