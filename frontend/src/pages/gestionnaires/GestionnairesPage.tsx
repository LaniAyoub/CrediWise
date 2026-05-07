import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { gestionnaireService } from '@/services/gestionnaire.service';
import type { Gestionnaire, GestionnaireCreateRequest, GestionnaireUpdateRequest } from '@/types/gestionnaire.types';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import SearchBar from '@/components/ui/SearchBar';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import GestionnaireForm from '@/components/forms/GestionnaireForm';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';

const GestionnairesPage = () => {
  const { t } = useTranslation('gestionnaires');
  const [gestionnaires, setGestionnaires] = useState<Gestionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGestionnaire, setEditingGestionnaire] = useState<Gestionnaire | null>(null);
  const [deletingGestionnaire, setDeletingGestionnaire] = useState<Gestionnaire | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGestionnaires = async () => {
    try {
      const response = await gestionnaireService.getAll();
      setGestionnaires(response.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGestionnaires();
  }, []);

  const filteredGestionnaires = useMemo(() => {
    if (!searchQuery) return gestionnaires;
    const q = searchQuery.toLowerCase();
    return gestionnaires.filter(
      (g) =>
        g.firstName?.toLowerCase().includes(q) ||
        g.lastName?.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.cin?.toLowerCase().includes(q) ||
        g.role?.toLowerCase().includes(q) ||
        g.agence?.libelle?.toLowerCase().includes(q)
    );
  }, [gestionnaires, searchQuery]);

  const handleCreate = async (data: GestionnaireCreateRequest) => {
    setIsSubmitting(true);
    try {
      const payload: GestionnaireCreateRequest = {
        email: data.email,
        cin: data.cin,
        numTelephone: data.numTelephone,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        agenceId: data.agenceId,
        ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
        ...(data.address && { address: data.address }),
      };
      await gestionnaireService.create(payload);
      toast.success(t('messages.created'));
      setIsCreateModalOpen(false);
      fetchGestionnaires();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('messages.loadError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: GestionnaireUpdateRequest & { email?: string; cin?: string; agenceId?: string }) => {
    if (!editingGestionnaire) return;
    setIsSubmitting(true);
    try {
      const updateData: GestionnaireUpdateRequest = {
        ...(data.numTelephone && { numTelephone: data.numTelephone }),
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
        ...(data.address && { address: data.address }),
        ...(data.role && { role: data.role }),
        ...(data.active !== undefined && { active: data.active }),
      };
      await gestionnaireService.update(editingGestionnaire.id, updateData);
      toast.success(t('messages.updated'));
      setEditingGestionnaire(null);
      fetchGestionnaires();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('messages.loadError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingGestionnaire) return;
    setIsDeleting(true);
    try {
      await gestionnaireService.delete(deletingGestionnaire.id);
      toast.success(t('messages.deleted'));
      setDeletingGestionnaire(null);
      fetchGestionnaires();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('messages.loadError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page-title text-surface-900 dark:text-surface-50">{t('title')}</h1>
          <p className="text-caption text-surface-600 dark:text-surface-400 mt-2">{t('subtitle')}</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          {t('buttons.add')}
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <SearchBar
          placeholder={t('searchPlaceholder')}
          onSearch={setSearchQuery}
        />
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={5} />
      ) : (
        <Table
          headers={[t('table.name'), t('table.email'), t('table.cin'), t('table.role'), t('table.agence'), t('table.status'), t('table.actions')]}
          isEmpty={filteredGestionnaires.length === 0}
          emptyMessage={
            searchQuery
              ? t('messages.noSearch')
              : t('messages.noResults')
          }
        >
          {filteredGestionnaires.map((g) => (
            <tr key={g.id} className="table-row-hover min-h-12">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-700 dark:text-brand-300 text-xs font-bold">
                      {g.firstName?.[0]}{g.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-500 text-surface-900 dark:text-surface-100">
                      {g.firstName} {g.lastName}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">{g.numTelephone}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-surface-700 dark:text-surface-300">{g.email}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-mono text-surface-600 dark:text-surface-400">{g.cin}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant="info" size="sm">{g.role}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {g.agence?.libelle || '—'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={g.active ? 'success' : 'neutral'}>
                  {g.active ? t('form.active') : t('form.inactive')}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingGestionnaire(g)}
                  >
                    {t('buttons.edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeletingGestionnaire(g)}
                  >
                    {t('buttons.delete')}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Create Modal */}
      <Modal
        title={t('modals.createTitle')}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        size="lg"
      >
        <GestionnaireForm
          onSubmit={handleCreate}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={t('modals.editTitle')}
        isOpen={!!editingGestionnaire}
        onClose={() => setEditingGestionnaire(null)}
        size="lg"
      >
        {editingGestionnaire && (
          <GestionnaireForm
            onSubmit={handleUpdate}
            defaultValues={editingGestionnaire}
            isLoading={isSubmitting}
            isEdit
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingGestionnaire}
        onClose={() => setDeletingGestionnaire(null)}
        onConfirm={handleDelete}
        title={t('modals.deleteTitle')}
        message={`${t('confirmDelete')} ${deletingGestionnaire?.firstName} ${deletingGestionnaire?.lastName}? ${t('confirmDelete')}`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default GestionnairesPage;
