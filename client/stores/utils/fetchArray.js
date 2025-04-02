import {action, observable} from "mobx";
import {isPermitted} from "../permissions";

function createDecorator(prefix = 'fetch', options = {}) {
  return function (target) {
    return class extends target {
      executor = {cancel: null};
      @observable accessor data = [];
      @observable accessor fetchProgress = false;
      @observable accessor fetchError = false;
      @observable accessor fetchDone = false;
      @observable accessor fetchErrorText = '';
      @observable accessor total = 0;

      fetchDataAdapter = options.fetchDataAdapter || function (response) {
        return {data: response, total: response.length};
      };

      fetchMethod = options.fetchMethod || function (params, executor) {
        throw 'Не задан fetchMethod';
      };

      fetchFailed = options.fetchFailed || function (e) {};

      fetchSuccess = options.fetchSuccess || function(response) {};

      reset = options.reset || action(() => {
        this.data = [];
        this.total = 0;
        this.fetchProgress = false;
        this.fetchError = false;
        this.fetchDone = false;
        this.fetchErrorText = '';
      })

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
  }
}
export const withFetchArray = createDecorator();