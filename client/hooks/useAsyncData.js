import { useEffect, useState } from 'preact/hooks';

function extractError(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    'Не удалось загрузить данные.'
  );
}

function useAsyncData(loader, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    Promise.resolve()
      .then(() => loader())
      .then((response) => {
        if (!active) {
          return;
        }

        setData(response);
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }

        setError(extractError(requestError));
      })
      .finally(() => {
        if (!active) {
          return;
        }

        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, deps);

  return { data, loading, error };
}

export { extractError, useAsyncData };
