import {action, observable} from "mobx";
import {fetchArray} from "./fetchArray";
import {fetchObject} from "./fetchObject";
import {deepCopy} from "./deepCopy";

function createDecorator(fetchData, defaultData = [], options = {}) {
  const BaseStoreClass = class {
    executor = {cancel: null};
    defaultData = deepCopy(defaultData);
    @observable accessor data = deepCopy(this.defaultData);
    @observable accessor fetchProgress = false;
    @observable accessor fetchError = false;
    @observable accessor fetchDone = false;
    @observable accessor fetchErrorText = '';
    @observable accessor total = 0;

    fetchDataAdapter = options.fetchDataAdapter || function (response) {
      return response
    };
    fetchMethod = options.fetchMethod || function (params, executor) {
      throw 'Не задан fetchMethod';
    };
    fetchFailed = options.fetchFailed || function (e) {
    };
    fetchSuccess = options.fetchSuccess || function (response) {
    };
    checkPermissions = options.checkPermissions || function (e) {
    };
    checkNavigation = options.checkNavigation || function (e) {
    };
    logError = options.logError || function (e) {
      console.log(e)
    };
    reset = options.reset || action(() => {
      this.data = deepCopy(this.defaultData);
      this.total = 0;
      this.fetchProgress = false;
      this.fetchError = false;
      this.fetchDone = false;
      this.fetchErrorText = '';
    })

    @action fetchData = fetchData.bind(this)
  };

  return function (TargetClass) {
    const MixedClass = class extends BaseStoreClass {
      constructor(...args) {
        super(...args);
        const tempInstance = new TargetClass(...args);
        Object.keys(tempInstance).forEach(key => {
          this[key] = tempInstance[key];
        });
      }
    };

    Object.getOwnPropertyNames(TargetClass.prototype).forEach(prop => {
      if (prop !== 'constructor') {
        MixedClass.prototype[prop] = TargetClass.prototype[prop];
      }
    });

    Object.getOwnPropertyNames(TargetClass).forEach(prop => {
      if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
        MixedClass[prop] = TargetClass[prop];
      }
    });

    return MixedClass;
  };
}

export const withFetchArray = createDecorator(fetchArray, []);
export const withFetchObject = createDecorator(fetchObject, {});