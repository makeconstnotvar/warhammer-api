import axios from "axios";

const host = '//localhost:3000/api';

const get = url => async (params) => {
  const response = await axios.get(host + url, {params});
  return response.data;
};

const post = url => async (body) => {
  const response = await axios.post(host + url, body);
  return response.data;
}

const put = url => async (params) => {
  const response = await axios.put(host + url, params);
  return response.data;
}

const del = url => async (value) => {
  const {data, params} = value || {};
  const response = await axios.delete(host + url, {data, params});
  return response.data;
}

const patch = url => async (params) => {
  const response = await axios.patch(host + url, params);
  return response.data;
}

export {get, post, put, del, patch}