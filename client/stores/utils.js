import { action, observable } from 'mobx';

export function createMethodDecorator(methodName, options = {}) {
  const {
    prefix = methodName,
    successHandler,
    failureHandler,
    dataAdapter = (response) => response
  } = options;

  return function(target) {
    // Класс-декоратор, добавляющий метод и наблюдаемые свойства
    return class extends target {
      // Определяем наблюдаемые свойства для отслеживания состояния операции
      @observable accessor [`${prefix}Progress`] = false;
      @observable accessor [`${prefix}Error`] = false;
      @observable accessor [`${prefix}ErrorText`] = '';
      @observable accessor [`${prefix}Done`] = false;

      /**
       * Генерируемый метод для выполнения API-запроса
       * @param {Object} params - Параметры запроса
       * @returns {Promise} - Промис с результатом запроса
       */
      @action [`${methodName}Data`](params) {
        const executor = this[`${methodName}Executor`] || { cancel: null };
        if (executor.cancel) {
          executor.cancel('user cancel');
        }

        // Сбрасываем состояние перед запросом
        this[`${prefix}Progress`] = true;
        this[`${prefix}Error`] = false;
        this[`${prefix}ErrorText`] = '';
        this[`${prefix}Done`] = false;
        let requestCanceled = false;

        // Проверяем наличие метода API
        if (!this[`${methodName}Method`]) {
          throw new Error(`Метод ${methodName}Method не определен в классе`);
        }

        return this[`${methodName}Method`](params, executor)
          .then(action(response => {
            this[`${prefix}Done`] = true;
            const processedResponse = dataAdapter(response);

            // Вызываем пользовательский обработчик успеха, если он есть
            if (this[`${methodName}Success`]) {
              this[`${methodName}Success`](processedResponse);
            } else if (successHandler) {
              successHandler.call(this, processedResponse);
            }

            return processedResponse;
          }))
          .catch(action(e => {
            if (e.message === 'user cancel') {
              requestCanceled = true;
              return;
            }

            this[`${prefix}Error`] = true;

            // Проверяем коды ошибок, если есть функция проверки
            if (this.isPermitted && e?.response?.data?.code) {
              if (this.isPermitted(e.response.data.code)) {
                this[`${prefix}ErrorText`] = e.response.data.message;
              }
            }

            // Вызываем пользовательский обработчик ошибок, если он есть
            if (this[`${methodName}Failed`]) {
              this[`${methodName}Failed`](e);
            } else if (failureHandler) {
              failureHandler.call(this, e);
            }

            console.error(`Ошибка в ${methodName}Data:`, e);
            throw e;
          }))
          .finally(action(() => {
            if (!requestCanceled) {
              this[`${prefix}Progress`] = false;
            }
          }));
      }
    };
  };
}


export const withFetch = createMethodDecorator('fetch', {
  dataAdapter: function(response) {
    return {data: response, total: response.length};
  }
});

export const withCreate = createMethodDecorator('create');
export const withUpdate = createMethodDecorator('update');
export const withDelete = createMethodDecorator('delete');
export const withGetById = createMethodDecorator('getById');