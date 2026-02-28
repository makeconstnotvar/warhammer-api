import {Routes} from "./router";
import {Menu} from "./components/Menu";

const App = () => (
  <div className="app-shell">
    <Menu/>
    <main className="page-shell">
      <Routes/>
    </main>
  </div>
);

export {App};
