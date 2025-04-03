import {h} from 'preact';
import {observer} from "mobx-react-lite";
import {stores} from '../stores'
import {useEffect} from "preact/hooks";


const FactionList = observer(props => {
  const {$factionsStore} = stores;
  useEffect(() => {
    $factionsStore.fetchData()
  }, []);
  return (
    <div>
      <h2>Фракции</h2>
      {$factionsStore.error && <p>Error: {$factionsStore.error}</p>}
      <ul>
        {
          $factionsStore.data.map(faction => (
            <li key={faction.id}>{faction.name}</li>
          ))
        }
      </ul>
    </div>
  )
});

export {FactionList};