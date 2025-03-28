import {h} from 'preact';
import {Provider} from "mobx-react";
import {stores} from "./stores";
import {Routes} from "./router";


const App = () => (
    <Provider {...stores}>
        <div>
            <h1>Warhammer 40K</h1>
            <Routes/>
        </div>
    </Provider>
);

export {App};