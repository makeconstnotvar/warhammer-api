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

  fetchFailed = e => {

  };

  fetchSuccess = response => {
  };

  @action
  @action reset() {
    this.data = [];
    this.total = 0;
    this.fetchProgress = false;
    this.fetchError = false;
    this.fetchDone = false;
    this.fetchErrorText = '';
    this.noResults = false;
  }

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
}

export default BaseStore;