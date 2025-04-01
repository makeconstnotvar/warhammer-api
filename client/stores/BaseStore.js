import {action, observable} from 'mobx';
import axios from 'axios';
import {isPermitted} from "./permissions";

class BaseStore {
  executor = {cancel: null};
  @observable accessor data = [];
  @observable accessor fetchProgress = false;
  @observable accessor fetchError = false;
  @observable accessor fetchDone = false;
  @observable accessor fetchErrorText = '';
  @observable accessor total = 0;
  @observable accessor noResults = false;

  fetchDataAdapter = function (response) {
    return {data: response, total: response.length};
  };
  fetchMethod = function (params, executor) {
    throw 'Не задан fetchMethod';
  };

  fetchItemMethod = function (params, executor) {
    throw 'Не задан fetchMethod';
  };

  saveMethod = function (params) {
    throw 'Не задан saveMethod';
  };

  fetchFailed = e => {

  };

  fetchSuccess = response => {
  };

  fetchItemSuccess = response => {
    this.data = response;
  };

  saveSuccess = response => {

  };

  saveFailed = error => {

  };

  syncItems = store => {
  };


  // Общая функциональность для получения данных
  @action fetchData(params) {
    if (this.executor.cancel) {
      this.executor.cancel('user cancel');
    }

    this.fetchProgress = true;
    this.fetchError = false;
    this.fetchErrorText = '';
    this.fetchDone = false;
    let fetchCancel = false;

    return this.fetchMethod(params, this.executor)
      .then(action(response => {
        this.fetchDone = true;
        response = this.fetchDataAdapter(response);
        this.data = response?.data || [];
        this.total = response?.total || 0;
        this.fetchSuccess(response);
      }))
      .catch(action(e => {
        if (e.message == 'user cancel') {
          fetchCancel = true;
          return;
        }

        this.fetchError = true;
        if (isPermitted(e?.response?.data?.code)) {
          this.fetchErrorText = e.response.data.message;
        }

        this.fetchFailed(e);
        if (e.uri) {
          //navigate(e.uri);
        }
        console.error(e);
      }))
      .finally(action(() => {
        if (!fetchCancel) {
          this.fetchProgress = false;
        }
      }));
  }


  @action
  async getById(id) {
    try {
      this.isLoading = true;
      this.error = null;

      const response = await axios.get(`/api/${this.endpoint}/${id}`);
      this.selected = this.transformResponseData(response.data);

      return this.selected;
    } catch (error) {
      this.error = error.response?.data?.message || error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  @action
  async create(itemData) {
    try {
      this.isLoading = true;
      this.error = null;

      const preparedData = this.prepareRequestData(itemData);

      const response = await axios.post(`/api/${this.endpoint}`, preparedData);
      const newItem = this.transformResponseData(response.data);
      this.data.push(newItem);

      return newItem;
    } catch (error) {
      this.error = error.response?.data?.message || error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  @action
  async update(id, itemData) {
    try {
      this.isLoading = true;
      this.error = null;

      const preparedData = this.prepareRequestData(itemData);

      const response = await axios.put(`/api/${this.endpoint}/${id}`, preparedData);
      const updatedItem = this.transformResponseData(response.data);

      // Обновляем элемент в массиве data
      const index = this.data.findIndex(item => item.id === id);
      if (index !== -1) {
        this.data[index] = updatedItem;
      }

      return updatedItem;
    } catch (error) {
      this.error = error.response?.data?.message || error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  @action
  async delete(id) {
    try {
      this.isLoading = true;
      this.error = null;

      await axios.delete(`/api/${this.endpoint}/${id}`);

      // Удаляем элемент из массива data
      this.data = this.data.filter(item => item.id !== id);

      return id;
    } catch (error) {
      this.error = error.response?.data?.message || error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  // Дополнительные утилитарные методы
  @action
  resetError() {
    this.error = null;
  }

  @action
  reset() {
    this.data = [];
    this.isLoading = false;
    this.error = null;
    this.selected = null;
  }
}

export default BaseStore;