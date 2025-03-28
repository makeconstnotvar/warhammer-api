import {h} from 'preact';
import {inject, observer} from "mobx-react";

const FactionList = observer(inject('$factionStore')((props) => {
    const {$factionStore} = props;
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
}));

export {FactionList};