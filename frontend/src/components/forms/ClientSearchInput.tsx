import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  KeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { clientService } from '@/services/client.service';
import type { Client, ClientSearchResult } from '@/types/client.types';

// ── Constants ────────────────────────────────────────────────────────────────
const DEBOUNCE_MS = 220;
const MIN_CHARS = 2;
const MAX_RESULTS = 12;
const HISTORY_KEY = 'crediwise_recent_clients';
const HISTORY_MAX = 5;

// ── Local-storage recent-searches helpers ─────────────────────────────────────
function readHistory(): ClientSearchResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ClientSearchResult[]) : [];
  } catch {
    return [];
  }
}

function pushHistory(item: ClientSearchResult) {
  const prev = readHistory().filter((h) => h.id !== item.id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...prev].slice(0, HISTORY_MAX)));
}

// ── Highlight helper — wraps matched chars in <mark> ─────────────────────────
function highlight(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-brand-100 dark:bg-brand-900/60 text-brand-800 dark:text-brand-300 rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Display helpers ───────────────────────────────────────────────────────────
function clientDisplayName(c: ClientSearchResult | Client): string {
  if (c.clientType === 'PHYSICAL') {
    return `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.id;
  }
  return (c as ClientSearchResult).companyName || c.id;
}

function clientSubtitle(c: ClientSearchResult): string {
  const parts: string[] = [];
  if (c.nationalId) parts.push(c.nationalId);
  if (c.primaryPhone) parts.push(c.primaryPhone);
  if (c.email) parts.push(c.email);
  return parts.slice(0, 2).join(' · ') || c.id.slice(0, 8);
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-surface-200 dark:bg-surface-700 flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-2/3" />
      <div className="h-2.5 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
    </div>
  </div>
);

// ── Avatar initials ───────────────────────────────────────────────────────────
const Avatar = ({ name, type }: { name: string; type: string }) => {
  const initials = type === 'PHYSICAL'
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex-shrink-0 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 select-none">
      {initials || '?'}
    </div>
  );
};

// ── Result row ────────────────────────────────────────────────────────────────
const ResultRow = ({
  client,
  query,
  active,
  onSelect,
  onMouseEnter,
}: {
  client: ClientSearchResult;
  query: string;
  active: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}) => {
  const name = clientDisplayName(client);
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onMouseDown={(e) => e.preventDefault()} // prevent input blur
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
        active
          ? 'bg-brand-50 dark:bg-brand-900/30'
          : 'hover:bg-surface-50 dark:hover:bg-surface-700/60'
      }`}
    >
      <Avatar name={name} type={client.clientType} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
          {highlight(name, query)}
        </p>
        <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">
          {highlight(clientSubtitle(client), query)}
        </p>
      </div>
      {client.status === 'ACTIVE' && (
        <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
          ACTIF
        </span>
      )}
    </button>
  );
};

// ── Props ─────────────────────────────────────────────────────────────────────
export interface ClientSearchInputProps {
  /** Called when a client is confirmed — parent should fetch full data by ID */
  onSelect: (clientId: string) => void;
  /** Currently locked client (edit mode) */
  lockedClient?: Client | null;
  /** Clear selection */
  onClear?: () => void;
  error?: string;
  disabled?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
const ClientSearchInput: React.FC<ClientSearchInputProps> = ({
  onSelect,
  lockedClient,
  onClear,
  error,
  disabled,
}) => {
  const { t } = useTranslation('demandes');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [history] = useState<ClientSearchResult[]>(() => readHistory());

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Derived list shown in dropdown ──────────────────────────────────────────
  const displayList = useMemo<ClientSearchResult[]>(() => {
    if (query.trim().length < MIN_CHARS) return history;
    return results;
  }, [query, results, history]);

  // ── Debounced search ─────────────────────────────────────────────────────────
  const doSearch = useCallback((q: string) => {
    if (q.trim().length < MIN_CHARS) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Cancel in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    clientService.smartSearch(q.trim(), MAX_RESULTS)
      .then((res) => {
        setResults(res.data);
        setActiveIndex(-1);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), DEBOUNCE_MS);
  };

  // ── Select a result ──────────────────────────────────────────────────────────
  const handleSelect = useCallback((client: ClientSearchResult) => {
    pushHistory(client);
    setQuery('');
    setOpen(false);
    setResults([]);
    onSelect(client.id);
  }, [onSelect]);

  // ── Keyboard navigation ──────────────────────────────────────────────────────
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || displayList.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, displayList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(displayList[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const active = listRef.current.querySelector('[aria-selected="true"]') as HTMLElement | null;
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.closest('[data-client-search]')?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Locked / selected client view ────────────────────────────────────────────
  if (lockedClient) {
    const name = clientDisplayName(lockedClient);
    const age = (() => {
      if (!lockedClient.dateOfBirth) return null;
      const dob = new Date(lockedClient.dateOfBirth);
      if (isNaN(dob.getTime())) return null;
      const today = new Date();
      let a = today.getFullYear() - dob.getFullYear();
      if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) a--;
      return a >= 0 ? a : null;
    })();

    return (
      <div className="rounded-xl border border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/20 p-4 transition-colors">
        <div className="flex items-start gap-3">
          <Avatar name={name} type={lockedClient.clientType} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate">{name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {lockedClient.nationalId && (
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  <span className="font-medium text-surface-600 dark:text-surface-300">{t('form.nationalId') || 'CIN'}:</span>{' '}
                  {lockedClient.nationalId}
                </span>
              )}
              {lockedClient.primaryPhone && (
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  <span className="font-medium text-surface-600 dark:text-surface-300">{t('form.phone') || 'Tél'}:</span>{' '}
                  {lockedClient.primaryPhone}
                </span>
              )}
              {age !== null && (
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  <span className="font-medium text-surface-600 dark:text-surface-300">{t('form.age')}:</span>{' '}
                  <span className="font-bold text-brand-700 dark:text-brand-300">{age}</span>{' '}
                  {t('form.ageYears')}
                </span>
              )}
              {lockedClient.agenceLibelle && (
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  <span className="font-medium text-surface-600 dark:text-surface-300">{t('form.agency') || 'Agence'}:</span>{' '}
                  {lockedClient.agenceLibelle}
                </span>
              )}
            </div>
            {lockedClient.secteurActiviteLibelle && (
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {lockedClient.secteurActiviteLibelle}
                {lockedClient.sousActiviteLibelle ? ` · ${lockedClient.sousActiviteLibelle}` : ''}
              </p>
            )}
          </div>
          {!disabled && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="flex-shrink-0 text-surface-400 hover:text-rose-500 transition-colors p-1 rounded"
              title={t('form.changeClient') || 'Changer de client'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Search input + dropdown ──────────────────────────────────────────────────
  const showDropdown = open && !disabled && (displayList.length > 0 || loading || query.length >= MIN_CHARS);
  const showHistory = query.trim().length < MIN_CHARS && history.length > 0;
  const noResults = !loading && query.trim().length >= MIN_CHARS && results.length === 0;

  return (
    <div data-client-search className="relative">
      {/* Input */}
      <div className={`relative flex items-center rounded-xl border bg-white dark:bg-surface-800 transition-all ${
        open && !disabled
          ? 'border-brand-500 dark:border-brand-400 ring-2 ring-brand-500/20'
          : error
            ? 'border-red-400 dark:border-red-500'
            : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
      }`}>
        {/* Search icon */}
        <span className="absolute left-3 text-surface-400 dark:text-surface-500 pointer-events-none">
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          )}
        </span>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          autoComplete="off"
          disabled={disabled}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('form.searchClientPlaceholder')}
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-transparent text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />

        {/* Clear query button */}
        {query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
            className="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div
          role="listbox"
          ref={listRef}
          className="absolute z-50 mt-1.5 w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-xl overflow-hidden"
          style={{ maxHeight: '320px', overflowY: 'auto' }}
        >
          {/* Section header for history */}
          {showHistory && (
            <div className="px-4 pt-2.5 pb-1 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                {t('form.recentSearches') || 'Recherches récentes'}
              </span>
            </div>
          )}

          {/* Skeleton while loading */}
          {loading && [0, 1, 2].map((i) => <SkeletonRow key={i} />)}

          {/* Results list */}
          {!loading && displayList.map((client, idx) => (
            <ResultRow
              key={client.id}
              client={client}
              query={query}
              active={idx === activeIndex}
              onSelect={() => handleSelect(client)}
              onMouseEnter={() => setActiveIndex(idx)}
            />
          ))}

          {/* No results */}
          {noResults && (
            <div className="px-4 py-8 text-center">
              <svg className="w-8 h-8 mx-auto text-surface-300 dark:text-surface-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17l4 4m-4-4a6 6 0 10-8.485-8.485A6 6 0 0017 17z" />
              </svg>
              <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">
                {t('form.noClientFound') || 'Aucun client trouvé'}
              </p>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                {t('form.tryOtherTerms') || 'Essayez un autre nom, CIN ou téléphone'}
              </p>
            </div>
          )}

          {/* Min-chars hint */}
          {!loading && !showHistory && query.length > 0 && query.length < MIN_CHARS && (
            <div className="px-4 py-3 text-xs text-surface-400 dark:text-surface-500 text-center">
              {t('form.typeMoreChars') || `Saisissez au moins ${MIN_CHARS} caractères…`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientSearchInput;
