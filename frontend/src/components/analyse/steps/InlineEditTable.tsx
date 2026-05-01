import { FieldArrayWithId, UseFormRegister } from 'react-hook-form';

interface ColumnConfig {
  field: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'tel';
  width?: string;
}

interface InlineEditTableProps {
  name: string;
  fields: FieldArrayWithId<Record<string, unknown>>[];
  columns: ColumnConfig[];
  onAppend: () => void;
  onRemove: (index: number) => void;
  appendLabel: string;
  register: UseFormRegister<Record<string, unknown>>;
  readOnly?: boolean;
}

export const InlineEditTable = ({
  name,
  fields,
  columns,
  onAppend,
  onRemove,
  appendLabel,
  register,
  readOnly = false,
}: InlineEditTableProps) => {
  if (fields.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">Aucun enregistrement</p>
        {!readOnly && (
          <button
            type="button"
            onClick={onAppend}
            className="w-full px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
          >
            {appendLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {columns.map((col) => (
                <th key={col.field} className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {col.label}
                </th>
              ))}
              {!readOnly && (
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {fields.map((field, idx) => (
              <tr key={field.id} className="border-b border-gray-100 dark:border-gray-700/50">
                {columns.map((col) => (
                  <td key={col.field} className="py-2 px-2">
                    <input
                      type={col.type || 'text'}
                      {...register(`${name}.${idx}.${col.field}`)}
                      placeholder={col.placeholder}
                      disabled={readOnly}
                      className={`w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        readOnly
                          ? 'border-transparent bg-transparent dark:bg-transparent cursor-default'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </td>
                ))}
                {!readOnly && (
                  <td className="py-2 px-2">
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-bold"
                    >
                      ×
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={onAppend}
          className="w-full px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        >
          {appendLabel}
        </button>
      )}
    </div>
  );
};
