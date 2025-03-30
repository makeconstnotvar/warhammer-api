import {h} from 'preact';
import {Routes} from "./router";
import {Menu} from "./components/Menu";


const App = () => (
  <div>
    <Menu></Menu>
    <h1>Warhammer 40K</h1>
    <Routes/>
  </div>
);

export {App};