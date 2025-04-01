import {get} from "./utils";

const  charactersApi ={
  getCharacters: get('/characters'),
  getCharacter: id => get(`/characters/${id}`)(),
}
export {charactersApi}