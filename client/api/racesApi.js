import {get} from "./utils";

const racesApi = {
  getRaces: get('/races'),
  getRaceById: id => get(`/races/${id}`)()
}

export {racesApi};