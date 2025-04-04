import {h} from 'preact';
import {observer} from "mobx-react-lite";
import {stores} from '../stores'
import {useEffect} from "preact/hooks";


const RaceList = observer(props => {
  const {$racesStore} = stores;
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
    </div>
  )
});

export {RaceList};