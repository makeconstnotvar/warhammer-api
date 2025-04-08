import {h} from 'preact';
import {observer} from "mobx-react-lite";
import {stores} from '../stores'
import {useEffect,useState} from "preact/hooks";
import {Pager} from "../components/Pager";


const RaceList = observer(props => {
  const {$racesStore} = stores;
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    $racesStore.fetchData()
  }, []);

  return (
    <div>
      <h2>Рассы</h2>
      {$racesStore.fetchError && <p>Error: {$racesStore.fetchError}</p>}
      <ul>
        {
          $racesStore.data.map(item => (
            <li key={item.id}>{item.name}</li>
          ))
        }
      </ul>
      <Pager
        currentPage={currentPage}
        total={$racesStore.total}
        onPageChange={x => setCurrentPage(x)}
      />
    </div>
  )
});

export {RaceList};