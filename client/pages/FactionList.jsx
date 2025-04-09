import {h} from 'preact';
import {inject, observer} from "mobx-react";
import {useEffect, useState} from "preact/hooks";
import {Pager} from "../components/Pager";

const FactionList = inject('$factionsStore')(observer(FactionListComponent));

function FactionListComponent(props) {
  const {$factionsStore} = props;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    $factionsStore.fetchData();
  }, []);

  return (
    <div className="faction-list">
      <h2 className="mb-4">Фракции</h2>

      {$factionsStore.fetchError && (
        <div className="alert alert-danger" role="alert">
          Error: {$factionsStore.fetchError}
        </div>
      )}

      {$factionsStore.fetchProgress ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
        </div>
      ) : (
        <div className="card">
          <ul className="list-group list-group-flush">
            {$factionsStore.data.map(faction => (
              <li key={faction.id} className="list-group-item">{faction.name}</li>
            ))}
          </ul>
        </div>
      )}

      <Pager
        currentPage={currentPage}
        total={$factionsStore.total}
        onPageChange={x => setCurrentPage(x)}
      />
    </div>
  );
}

export {FactionList};