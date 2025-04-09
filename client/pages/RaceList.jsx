import { h } from 'preact';
import { observer, inject } from "mobx-react";
import { useEffect, useState } from "preact/hooks";
import { Pager } from "../components/Pager";

const RaceList = inject('$racesStore')(observer(RaceListComponent));

function RaceListComponent(props) {
  const { $racesStore } = props;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    $racesStore.fetchData();
  }, []);

  return (
    <div className="race-list">
      <h2 className="mb-4">Расы</h2>

      {$racesStore.fetchError && (
        <div className="alert alert-danger" role="alert">
          Error: {$racesStore.fetchError}
        </div>
      )}

      {$racesStore.fetchProgress ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
        </div>
      ) : (
        <div className="card">
          <ul className="list-group list-group-flush">
            {$racesStore.data.map(item => (
              <li key={item.id} className="list-group-item">{item.name}</li>
            ))}
          </ul>
        </div>
      )}

      <Pager
        currentPage={currentPage}
        total={$racesStore.total}
        onPageChange={x => setCurrentPage(x)}
      />
    </div>
  );
}

export { RaceList };