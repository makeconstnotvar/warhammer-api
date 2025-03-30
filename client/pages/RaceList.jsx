import {h} from 'preact';
import {observer} from "mobx-react-lite";
import {stores} from '../stores'
import {useEffect} from "preact/hooks";

const RaceList = observer(props => {
  const {$raceStore} = stores;
  useEffect(() => {
    $raceStore.fetchData()
  }, []);

  return (
    <div>
      <h2>Рассы</h2>
      {$raceStore.error && <p>Error: {$raceStore.error}</p>}
      <ul>
        {
          $raceStore.data.map(item => (
            <li key={item.id}>{item.name}</li>
          ))
        }
      </ul>
    </div>
  )
});

export {RaceList};