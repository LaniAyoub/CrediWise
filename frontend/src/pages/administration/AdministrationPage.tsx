import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { administrationService } from '@/services/administrationService';
import type { RegleAffichage, RegleAffichageRequest, ProductOption, Navigation } from '@/types/regleAffichage.types';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const blankDraft = (): RegleAffichageRequest => ({
  conditionLabel: '',
  pays: '',
  productId: '',
  productName: '',
  opInf: '',
  borneInf: undefined,
  opSup: '',
  borneSup: undefined,
  navigation: '>5k',
});

// ── Inline edit state ─────────────────────────────────────────────────────────
type EditDraft = RegleAffichageRequest & { id: number };

const AdministrationPage = () => {
  const { t } = useTranslation('administration');
  const { t: tCommon } = useTranslation('common');

  const [regles, setRegles] = useState<RegleAffichage[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<RegleAffichageRequest>(blankDraft());
  const [saving, setSaving] = useState(false);

  // Edit mode: null = no row being edited, otherwise the rule being edited
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reglesRes, productsRes] = await Promise.all([
        administrationService.listRegles(),
        administrationService.listProducts(),
      ]);
      setRegles(reglesRes.data);
      setProducts(productsRes.data);
    } catch {
      toast.error(t('regles.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleProductIdChange = (productId: string, target: 'draft' | 'edit') => {
    const product = products.find((p) => p.productId === productId);
    if (target === 'draft') {
      setDraft((prev) => ({ ...prev, productId, productName: product?.name ?? '' }));
    } else {
      setEditDraft((prev) => prev ? { ...prev, productId, productName: product?.name ?? '' } : prev);
    }
  };

  const handleSave = async () => {
    if (!draft.navigation) { toast.error(t('regles.errors.saveFailed')); return; }
    setSaving(true);
    try {
      await administrationService.createRegle(draft);
      toast.success(t('regles.saved'));
      setShowForm(false);
      setDraft(blankDraft());
      loadData();
    } catch {
      toast.error(t('regles.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const startEdit = (regle: RegleAffichage) => {
    setEditDraft({
      id: regle.id,
      conditionLabel: regle.conditionLabel ?? '',
      pays: regle.pays ?? '',
      productId: regle.productId ?? '',
      productName: regle.productName ?? '',
      opInf: regle.opInf ?? '',
      borneInf: regle.borneInf,
      opSup: regle.opSup ?? '',
      borneSup: regle.borneSup,
      navigation: regle.navigation,
    });
    setShowForm(false); // close create form if open
  };

  const cancelEdit = () => setEditDraft(null);

  const handleUpdate = async () => {
    if (!editDraft) return;
    setEditSaving(true);
    try {
      await administrationService.updateRegle(editDraft.id, editDraft);
      toast.success(t('regles.updated'));
      setEditDraft(null);
      loadData(); // reload — old rule disappears (isActive=false filtered), new version appears
    } catch {
      toast.error(t('regles.errors.updateFailed'));
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!window.confirm(t('regles.deleteConfirm'))) return;
    try {
      await administrationService.deleteRegle(id);
      toast.success(t('regles.deleted'));
      setRegles((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error(t('regles.errors.deleteFailed'));
    }
  };

  const inputCls =
    'w-full text-xs border border-surface-300 dark:border-surface-600 rounded px-2 py-1.5 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-1 focus:ring-brand-500';

  const columns = ['pays', 'idProduit', 'nomProduit', 'opInf', 'borneInf', 'opSup', 'borneSup', 'navigation', 'version', 'actions'] as const;

  // ── Shared row-form renderer (create & edit share same layout) ─────────────
  const renderFormRow = (
    values: RegleAffichageRequest,
    onChange: (patch: Partial<RegleAffichageRequest>) => void,
    onSave: () => void,
    onCancel: () => void,
    isSaving: boolean,
    accent: 'emerald' | 'amber'
  ) => (
    <tr className={`border-b border-surface-200 dark:border-surface-700 ${
      accent === 'emerald'
        ? 'bg-emerald-50 dark:bg-emerald-900/10'
        : 'bg-amber-50 dark:bg-amber-900/10'
    }`}>
      <td className="px-2 py-2">
        <input
          className={inputCls}
          value={values.pays ?? ''}
          onChange={(e) => onChange({ pays: e.target.value })}
        />
      </td>
      <td className="px-2 py-2 min-w-[110px]">
        <select
          className={inputCls}
          value={values.productId ?? ''}
          onChange={(e) => handleProductIdChange(e.target.value, accent === 'emerald' ? 'draft' : 'edit')}
        >
          <option value="">{t('regles.selectProduct')}</option>
          {products.map((p) => (
            <option key={p.productId} value={p.productId}>{p.productId}</option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2 min-w-[130px]">
        <input
          className={`${inputCls} bg-surface-100 dark:bg-surface-600 cursor-default`}
          value={values.productName ?? ''}
          readOnly
        />
      </td>
      <td className="px-2 py-2 min-w-[70px]">
        <select
          className={inputCls}
          value={values.opInf ?? ''}
          onChange={(e) => onChange({ opInf: e.target.value })}
        >
          <option value="">—</option>
          <option value=">=">&gt;=</option>
          <option value=">">&gt;</option>
          <option value="=">=</option>
        </select>
      </td>
      <td className="px-2 py-2 min-w-[90px]">
        <input
          type="number"
          className={inputCls}
          value={values.borneInf ?? ''}
          onChange={(e) => onChange({ borneInf: e.target.value ? Number(e.target.value) : undefined })}
        />
      </td>
      <td className="px-2 py-2 min-w-[70px]">
        <select
          className={inputCls}
          value={values.opSup ?? ''}
          onChange={(e) => onChange({ opSup: e.target.value })}
        >
          <option value="">—</option>
          <option value="<=">&lt;=</option>
          <option value="<">&lt;</option>
          <option value="=">=</option>
        </select>
      </td>
      <td className="px-2 py-2 min-w-[90px]">
        <input
          type="number"
          className={inputCls}
          value={values.borneSup ?? ''}
          onChange={(e) => onChange({ borneSup: e.target.value ? Number(e.target.value) : undefined })}
        />
      </td>
      <td className="px-2 py-2 min-w-[90px]">
        <select
          className={inputCls}
          value={values.navigation}
          onChange={(e) => onChange({ navigation: e.target.value as Navigation })}
        >
          <option value=">5k">{t('regles.navigation.gt5k')}</option>
          <option value="<5k">{t('regles.navigation.lt5k')}</option>
        </select>
      </td>
      {/* version column — empty for form rows */}
      <td className="px-2 py-2" />
      <td className="px-2 py-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSave}
            disabled={isSaving}
            className={`px-2.5 py-1 text-xs font-medium text-white rounded transition-colors disabled:opacity-50 ${
              accent === 'emerald'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isSaving ? t('regles.saving') : tCommon('common.save')}
          </button>
          <button
            onClick={onCancel}
            className="px-2.5 py-1 text-xs font-medium border border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 rounded hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            {tCommon('common.cancel')}
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="page-container space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-page-title text-surface-900 dark:text-surface-50">{t('title')}</h1>
        <p className="text-body text-surface-500 dark:text-surface-400 mt-1">{t('subtitle')}</p>
      </div>

      {/* Rules card */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-section-title text-surface-900 dark:text-surface-50">{t('regles.title')}</h2>
            <p className="text-caption text-surface-500 dark:text-surface-400 mt-0.5">{t('regles.subtitle')}</p>
          </div>
          {!showForm && !editDraft && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              {t('regles.addRow')}
            </Button>
          )}
        </div>

        {/* Edit-mode banner */}
        {editDraft && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-300">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5M3 21h4l11-11-4-4L3 17v4z" />
            </svg>
            {t('regles.editingNote')}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-700">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-surface-50 dark:bg-surface-750">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide border-b border-surface-200 dark:border-surface-700 whitespace-nowrap"
                  >
                    {t(`regles.columns.${col}`)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Create new-row form */}
              {showForm && renderFormRow(
                draft,
                (patch) => setDraft((p) => ({ ...p, ...patch })),
                handleSave,
                () => { setShowForm(false); setDraft(blankDraft()); },
                saving,
                'emerald'
              )}

              {/* Empty state */}
              {!loading && regles.length === 0 && !showForm && (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-surface-400 dark:text-surface-600">
                    {t('regles.noRules')}
                  </td>
                </tr>
              )}

              {/* Loading skeleton */}
              {loading && [1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-surface-100 dark:border-surface-700">
                  {Array.from({ length: columns.length }).map((_, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Data rows */}
              {!loading && regles.map((regle) => {
                // If this row is being edited → show inline edit form
                if (editDraft?.id === regle.id) {
                  return renderFormRow(
                    editDraft,
                    (patch) => setEditDraft((p) => p ? { ...p, ...patch } : p),
                    handleUpdate,
                    cancelEdit,
                    editSaving,
                    'amber'
                  );
                }

                return (
                  <tr
                    key={regle.id}
                    className="border-b border-surface-100 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-750 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300">
                      {regle.pays || '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-surface-700 dark:text-surface-300">
                      {regle.productId || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300">
                      {regle.productName || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-surface-500 dark:text-surface-400 font-mono">
                      {regle.opInf || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300">
                      {regle.borneInf != null ? regle.borneInf.toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-surface-500 dark:text-surface-400 font-mono">
                      {regle.opSup || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-surface-700 dark:text-surface-300">
                      {regle.borneSup != null ? regle.borneSup.toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        regle.navigation === '<5k'
                          ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                          : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      }`}>
                        {regle.navigation}
                      </span>
                    </td>
                    {/* Version badge */}
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400">
                        v{regle.version}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {/* Edit button */}
                        <button
                          onClick={() => startEdit(regle)}
                          title={t('regles.edit')}
                          disabled={!!editDraft}
                          className="text-surface-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5M3 21h4l11-11-4-4L3 17v4z" />
                          </svg>
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(regle.id)}
                          title={t('regles.deleteConfirm')}
                          disabled={!!editDraft}
                          className="text-surface-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <p className="text-xs text-surface-400 dark:text-surface-500">
          {t('regles.versionLegend')}
        </p>
      </div>
    </div>
  );
};

export default AdministrationPage;
