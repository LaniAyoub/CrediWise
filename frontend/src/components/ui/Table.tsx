import React from 'react';
import { useTranslation } from 'react-i18next';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

const Table = ({ headers, children, emptyMessage, isEmpty = false }: TableProps) => {
  const { t } = useTranslation('common');
  const defaultEmptyMessage = emptyMessage ?? t('common.noData');
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full table-auto divide-y divide-surface-200 dark:divide-surface-700">
          <thead>
            <tr className="bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-4 py-3 text-left text-label text-surface-600 dark:text-surface-400 break-words"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
            {isEmpty ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-12 h-12 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">{defaultEmptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
