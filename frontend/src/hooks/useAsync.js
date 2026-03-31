import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer les requêtes API
 * @param {Function} apiFunction - La fonction API à utiliser
 * @returns {Object} - {data, loading, error, execute}
 */
export const useAsync = (apiFunction) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args) => {
      setState({ data: null, loading: true, error: null });
      try {
        const response = await apiFunction(...args);
        setState({ data: response.data, loading: false, error: null });
        return response.data;
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        setState({ data: null, loading: false, error: errorMessage });
        throw error;
      }
    },
    [apiFunction]
  );

  return { ...state, execute };
};
