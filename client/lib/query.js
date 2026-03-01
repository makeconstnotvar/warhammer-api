function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    query.set(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

function getCurrentSearchParams() {
  if (typeof window === 'undefined') {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.search || '');
}

function hasSearchParams() {
  return getCurrentSearchParams().toString().length > 0;
}

function readQueryState(defaults = {}) {
  const searchParams = getCurrentSearchParams();

  return Object.entries(defaults).reduce((result, [key, fallbackValue]) => {
    const value = searchParams.get(key);
    result[key] = value !== null ? value : fallbackValue;
    return result;
  }, {});
}

function replaceQueryState(params = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  const nextSearchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    nextSearchParams.set(key, String(value));
  });

  const nextQuery = nextSearchParams.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`;
  window.history.replaceState({}, '', nextUrl);
}

function parseCsvParam(value) {
  return [...new Set(
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )];
}

function toCsvParam(values = []) {
  return [...new Set((values || []).map((item) => String(item).trim()).filter(Boolean))].join(',');
}

export { buildQueryString, hasSearchParams, parseCsvParam, readQueryState, replaceQueryState, toCsvParam };
