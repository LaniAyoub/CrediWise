import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
}

const SearchBar = ({
  placeholder,
  onSearch,
  debounceMs = 300,
}: SearchBarProps) => {
  const { t } = useTranslation('common');
  const defaultPlaceholder = placeholder ?? t('common.searchPlaceholder');
  const [query, setQuery] = useState('');

  const debouncedSearch = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (value: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => onSearch(value), debounceMs);
      };
    })(),
    [onSearch, debounceMs]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <svg
          className="w-4 h-4 text-surface-400 dark:text-surface-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={defaultPlaceholder}
        className="block w-full rounded-lg border border-surface-200 bg-white dark:bg-surface-800 pl-10 pr-4 py-2.5 text-sm text-surface-800 dark:text-surface-200 placeholder:text-surface-400 dark:placeholder:text-surface-500 transition-smooth focus-ring hover:border-surface-300 dark:hover:border-surface-700 focus:border-brand-500 dark:focus:border-brand-400"
      />
      {query && (
        <button
          onClick={() => {
            setQuery('');
            onSearch('');
          }}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
