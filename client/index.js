import { h, render } from 'preact';
import {App} from './App';
import { configure } from 'mobx';
import './styles/styles.scss';

configure({ enforceActions: 'never' });

render(<App />, document.getElementById('app'));