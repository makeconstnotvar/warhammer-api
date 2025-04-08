import { h } from 'preact';

const Menu = props => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <a className="navbar-brand" href="/">Warhammer 40K</a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" href="/">Главная</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/races">Расы</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/factions">Фракции</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/characters">Персонажи</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export { Menu };