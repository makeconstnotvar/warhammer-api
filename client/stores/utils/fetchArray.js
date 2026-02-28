import * as queryCore from 'query-core';

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

      if (Array.isArray(this.data)) {
        await Promise.all(this.data.map(async (item) => {
          if (typeof queryCore.getFieldStatus === 'function') {
            item._progressStatus = await queryCore.getFieldStatus(item, 'progress');
          }
        }));
      }

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
