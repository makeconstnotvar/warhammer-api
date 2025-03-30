import {h} from 'preact';
import {observer} from "mobx-react-lite";
import {stores} from '../stores'

const FactionList = observer((props) => {
  const {$factionStore} = stores;
  return (
    <div>
      <h2>Factions</h2>
      {$factionStore.error && <p>Error: {$factionStore.error}</p>}
      <ul>
        {$factionStore.factions.map(faction => (
          <li key={faction.id}>{faction.name}</li>
        ))}
      </ul>
    </div>
  )
});

export {FactionList};