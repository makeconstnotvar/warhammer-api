import {h} from 'preact';
import {observer} from "mobx-react-lite";
import {stores} from '../stores'
import {useEffect} from "preact/hooks";

const CharacterList = observer(props => {
  const {$charactersStore} = stores;

  useEffect(() => {
    $charactersStore.fetchData()
  }, []);


  return (
    <div>
      <h2>Персонажи</h2>
      {$charactersStore.error && <p>Error: {$charactersStore.error}</p>}
      <ul>
        {
          $charactersStore.data.map(item => (
            <li key={item.id}>{item.name}</li>
          ))
        }
      </ul>
    </div>
  )
});

export {CharacterList};