import { h, render } from 'preact';
import {App} from './App';
import { configure } from 'mobx';

configure({ enforceActions: 'never' });

render(<App />, document.getElementById('app'));