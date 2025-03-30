import {h} from 'preact';
import {observer} from "mobx-react-lite";
import {stores} from '../stores'
import {useEffect} from "preact/hooks";

const CharacterList = observer(props => {
  useEffect(() => {
    $characterStore.fetchData()
  }, []);

  const {$characterStore} = stores;
  return (
    <div>
      <h2>Персонажи</h2>
      {$characterStore.error && <p>Error: {$characterStore.error}</p>}
      <ul>
        {
          $characterStore.data.map(item => (
            <li key={item.id}>{item.name}</li>
          ))
        }
      </ul>
    </div>
  )
});

export {CharacterList};