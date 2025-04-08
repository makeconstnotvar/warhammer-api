import {h} from 'preact';
import {observer} from "mobx-react-lite";
import {stores} from '../stores'
import {useEffect,useState} from "preact/hooks";
import {Pager} from "../components/Pager";


const FactionList = observer(props => {
  const {$factionsStore} = stores;
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    $factionsStore.fetchData()
  }, []);
  return (
    <div>
      <h2>Фракции</h2>
      {$factionsStore.fetchError && <p>Error: {$factionsStore.fetchError}</p>}
      <ul>
        {
          $factionsStore.data.map(faction => (
            <li key={faction.id}>{faction.name}</li>
          ))
        }
      </ul>
      <Pager
        currentPage={currentPage}
        total={$factionsStore.total}
        onPageChange={x => setCurrentPage(x)}
      />
    </div>
  )
});

export {FactionList};