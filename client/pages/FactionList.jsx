import {h} from 'preact';
import {observer} from "mobx-react-lite";
import {stores} from '../stores'
import {useEffect} from "preact/hooks";

const FactionList = observer(props => {
  const {$factionStore} = stores;
  useEffect(() => {
    $factionStore.fetchData()
  }, []);
  return (
    <div>
      <h2>Фракции</h2>
      {$factionStore.error && <p>Error: {$factionStore.error}</p>}
      <ul>
        {
          $factionStore.data.map(faction => (
            <li key={faction.id}>{faction.name}</li>
          ))
        }
      </ul>
    </div>
  )
});

export {FactionList};