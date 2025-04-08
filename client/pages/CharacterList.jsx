import {h} from 'preact';
import {observer} from "mobx-react-lite";
import {stores} from '../stores'
import {useEffect, useState} from "preact/hooks";
import {Pager} from "../components/Pager";

const CharacterList = observer(props => {
  const {$charactersStore} = stores;
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    $charactersStore.fetchData()
  }, []);


  return (
    <div>
      <h2>Персонажи</h2>
      {$charactersStore.fetchError && <p>Error: {$charactersStore.fetchError}</p>}
      <ul>
        {
          $charactersStore.data.map(item => (
            <li key={item.id}>{item.name}</li>
          ))
        }
      </ul>
      <Pager
        currentPage={currentPage}
        total={$charactersStore.total}
        onPageChange={x => setCurrentPage(x)}
      />
    </div>
  )
});

export {CharacterList};