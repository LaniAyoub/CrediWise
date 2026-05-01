import React from 'react';
import { useTranslation } from 'react-i18next';
import { FieldArrayWithId, FieldErrors, UseFormRegister } from 'react-hook-form';
import { CATEGORIE_LABELS } from './step2Schema';
import { formatAmount } from '@/utils/formatAmount';

interface DynamicListTableProps {
  title: string;
  showCategoryDropdown: boolean;
  descriptionPlaceholder: string;
  amountLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: FieldArrayWithId<any, any, 'id'>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<any>;
  onAppend: () => void;
  onRemove: (index: number) => void;
  appendLabel: string;
  minRows: number;
  totalLabel: string;
  totalValue: number;
  fieldPrefix: string;
  readOnly?: boolean;
}

const DynamicListTable: React.FC<DynamicListTableProps> = ({
  title,
  showCategoryDropdown,
  descriptionPlaceholder,
  amountLabel,
  fields,
  register,
  errors,
  onAppend,
  onRemove,
  appendLabel,
  minRows,
  totalLabel,
  totalValue,
  fieldPrefix,
  readOnly = false,
}) => {
  const { t } = useTranslation('analyse');

  const getFieldError = (index: number, fieldName: string): string | undefined => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldErrors = errors[fieldPrefix] as any;
    return fieldErrors?.[index]?.[fieldName]?.message as string | undefined;
  };

  const canDelete = !readOnly && fields.length > minRows;

  return (
    <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-6 shadow-sm">
      {/* Title */}
      <h3 className="text-heading text-surface-900 dark:text-surface-50 mb-6">
        {title}
      </h3>

      {/* Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-700">
              {showCategoryDropdown && (
                <th className="text-left text-label text-surface-600 dark:text-surface-400 font-medium pb-3 px-3">
                  {t('fields.categorie')}*
                </th>
              )}
              <th className="text-left text-label text-surface-600 dark:text-surface-400 font-medium pb-3 px-3">
                {t('fields.description')}
              </th>
              <th className="text-right text-label text-surface-600 dark:text-surface-400 font-medium pb-3 px-3">
                {amountLabel}
              </th>
              <th className="w-12 pb-3" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <React.Fragment key={field.id}>
                <tr className="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                  {/* Category Column */}
                  {showCategoryDropdown && (
                    <td className="px-3 py-4">
                      <select
                        {...register(`${fieldPrefix}.${index}.categorie`)}
                        defaultValue=""
                        disabled={readOnly}
                        className={`w-full px-3 py-2 text-body border rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${readOnly ? 'border-transparent cursor-default' : 'border-surface-300 dark:border-surface-600'}`}
                      >
                        <option value="" disabled>
                          -- Choisir une catégorie --
                        </option>
                        {(Object.entries(CATEGORIE_LABELS) as Array<
                          [string, string]
                        >).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {getFieldError(index, 'categorie') && (
                        <p className="text-xs text-rose-500 mt-1">
                          {getFieldError(index, 'categorie')}
                        </p>
                      )}
                    </td>
                  )}

                  {/* Description Column */}
                  <td className="px-3 py-4">
                    <input
                      type="text"
                      placeholder={readOnly ? '' : descriptionPlaceholder}
                      disabled={readOnly}
                      {...register(`${fieldPrefix}.${index}.description`)}
                      className={`w-full px-3 py-2 text-body border rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${readOnly ? 'border-transparent cursor-default' : 'border-surface-300 dark:border-surface-600'}`}
                    />
                    {getFieldError(index, 'description') && (
                      <p className="text-xs text-rose-500 mt-1">
                        {getFieldError(index, 'description')}
                      </p>
                    )}
                  </td>

                  {/* Amount Column */}
                  <td className="px-3 py-4 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={readOnly}
                      {...register(`${fieldPrefix}.${index}.${showCategoryDropdown ? 'cout' : 'montant'}`, {
                        valueAsNumber: true,
                      })}
                      className={`w-full px-3 py-2 text-body border rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 ${readOnly ? 'border-transparent cursor-default' : 'border-surface-300 dark:border-surface-600'}`}
                    />
                    {getFieldError(index, showCategoryDropdown ? 'cout' : 'montant') && (
                      <p className="text-xs text-rose-500 mt-1">
                        {getFieldError(index, showCategoryDropdown ? 'cout' : 'montant')}
                      </p>
                    )}
                  </td>

                  {/* Delete Button */}
                  <td className="px-3 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      disabled={!canDelete}
                      className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                        canDelete
                          ? 'text-surface-400 hover:text-rose-600 dark:hover:text-rose-400'
                          : 'text-surface-300 dark:text-surface-600 cursor-not-allowed opacity-50'
                      }`}
                      aria-label="Supprimer"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Total Row */}
      <div className="border-t border-surface-200 dark:border-surface-700 pt-4 mb-6 flex justify-between items-center px-3">
        <p className="text-label font-medium text-surface-900 dark:text-surface-50">
          {totalLabel}
        </p>
        <p className="text-heading font-bold text-emerald-600 dark:text-emerald-400">
          {formatAmount(totalValue)}
        </p>
      </div>

      {/* List-level error */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(errors[fieldPrefix] as any)?.message && (
        <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(errors[fieldPrefix] as any).message}
        </p>
      )}

      {/* Append Button */}
      {!readOnly && (
        <button
          type="button"
          onClick={onAppend}
          className="px-4 py-2 text-sm font-medium border border-surface-300 dark:border-surface-600 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
        >
          {appendLabel}
        </button>
      )}
    </div>
  );
};

export default DynamicListTable;
