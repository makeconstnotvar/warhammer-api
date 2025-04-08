import { h } from 'preact';
import { Routes } from "./router";
import { Menu } from "./components/Menu";
import './styles/styles.scss';

const App = () => (
  <div className="app-container">
    <Menu />
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">Warhammer 40K</h1>
          <Routes />
        </div>
      </div>
    </div>
  </div>
);

export { App };