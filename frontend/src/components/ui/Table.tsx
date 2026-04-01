import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

const Table = ({ headers, children, emptyMessage = 'No data found', isEmpty = false }: TableProps) => {
  return (
    <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-100">
          <thead>
            <tr className="bg-surface-50/80">
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-6 py-3.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {isEmpty ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-12 h-12 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm text-surface-400 font-medium">{emptyMessage}</p>
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
