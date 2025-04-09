import {h} from 'preact';
import {inject, observer} from "mobx-react";
import {useEffect, useState} from "preact/hooks";
import {Pager} from "../components/Pager";

@inject("$charactersStore")
@observer
function CharacterList(props) {
  const {$charactersStore} = props;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    $charactersStore.fetchData();
  }, []);

  return (
    <div className="character-list">
      <h2 className="mb-4">Персонажи</h2>
      {
        $charactersStore.fetchError &&
        <div className="alert alert-danger" role="alert">
          Error: {$charactersStore.fetchError}
        </div>
      }
      {
        $charactersStore.fetchProgress ? (
          <div className="d-flex justify-content-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
          </div>
        ) : (
          <div className="card">
            <ul className="list-group list-group-flush">
              {$charactersStore.data.map(item => (
                <li key={item.id} className="list-group-item">{item.name}</li>
              ))}
            </ul>
          </div>
        )}

      <Pager
        currentPage={currentPage}
        total={$charactersStore.total}
        onPageChange={x => setCurrentPage(x)}
      />
    </div>
  );
}

export {CharacterList};