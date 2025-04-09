import {h} from 'preact';

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="alert alert-danger" role="alert">
        <h2 className="alert-heading">Страница не найдена</h2>
        <p>Запрашиваемая страница не существует.</p>
      </div>
    </div>
  )
}

export {NotFound};