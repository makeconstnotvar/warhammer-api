const Menu = () => {
  return (
    <nav className="topbar">
      <div className="topbar-inner">
        <a className="brand-lockup" href="/">
          <span className="brand-title">Warhammer 40K API</span>
          <span className="brand-subtitle">Public docs client</span>
        </a>

        <div className="topbar-links">
          <a href="/quick-start">Quick Start</a>
          <a href="/resources">Resources</a>
          <a href="/query-guide">Query Guide</a>
          <a href="/stats">Stats</a>
          <a href="/compare">Compare</a>
          <a href="/explore/graph">Graph</a>
          <a href="/explore/path">Path</a>
          <a href="/playground">Playground</a>
          <a href="/examples/concurrency">Concurrency</a>
        </div>
      </div>
    </nav>
  );
};

export { Menu };
