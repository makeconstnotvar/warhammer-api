function NotFound() {
  return (
    <section className="hero-panel hero-panel-compact">
      <div>
        <div className="section-eyebrow">404</div>
        <h1>Страница не найдена</h1>
        <p className="page-lead">
          В клиенте доступны только разделы документации и примеров API.
        </p>
        <a className="action-link" href="/">Вернуться на главную</a>
      </div>
    </section>
  )
}

export {NotFound};
