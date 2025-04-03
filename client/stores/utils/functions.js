export function fetchArray(params) {
  (async () => {
    if (this.executor.cancel) {
      this.executor.cancel('user cancel');
    }

    this.fetchProgress = true;
    this.fetchError = false;
    this.fetchErrorText = '';
    this.fetchDone = false;
    let fetchCancel = false;

    try {
      let response = await this.fetchMethod(params, this.executor)
      response = this.fetchDataAdapter(response);
      this.data = response?.data || [];
      this.total = response?.total || 0;
      this.fetchSuccess(response);
      this.fetchDone = true;
    } catch (e) {
      if (e.message == 'user cancel') {
        fetchCancel = true;
        return;
      }
      this.fetchError = true;
      this.checkPermissions(e);
      this.checkNavigation(e);
      this.logError(e);
      this.fetchFailed(e);
    } finally {
      if (!fetchCancel) {
        this.fetchProgress = false;
      }
    }
  })()
}
export function fetchOject(params) {
  (async () => {
    if (this.executor.cancel) {
      this.executor.cancel('user cancel');
    }

    this.fetchProgress = true;
    this.fetchError = false;
    this.fetchErrorText = '';
    this.fetchDone = false;
    let fetchCancel = false;

    try {
      let response = await this.fetchMethod(params, this.executor)
      response = this.fetchDataAdapter(response);
      this.data = response?.data || {};
      this.fetchSuccess(response);
      this.fetchDone = true;
    } catch (e) {
      if (e.message == 'user cancel') {
        fetchCancel = true;
        return;
      }
      this.fetchError = true;
      this.checkPermissions(e);
      this.checkNavigation(e);
      this.logError(e);
      this.fetchFailed(e);
    } finally {
      if (!fetchCancel) {
        this.fetchProgress = false;
      }
    }
  })()
}

export function deepCopy(input) {
  if (input === null) return null;
  if (Array.isArray(input)) return input.map(deepCopy);
  if (typeof input === 'object') {
    const copy = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        copy[key] = deepCopy(input[key]);
      }
    }
    return copy;
  }
  return input;
}