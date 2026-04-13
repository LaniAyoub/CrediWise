import React, { useState, useEffect, useMemo } from 'react';
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
        ...(data.password && { password: data.password }),
      };
      await gestionnaireService.create(payload);
      toast.success('Gestionnaire created successfully');
      setIsCreateModalOpen(false);
      fetchGestionnaires();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create gestionnaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: GestionnaireUpdateRequest & { email?: string; cin?: string; agenceId?: string; password?: string }) => {
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
      toast.success('Gestionnaire updated successfully');
      setEditingGestionnaire(null);
      fetchGestionnaires();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update gestionnaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingGestionnaire) return;
    setIsDeleting(true);
    try {
      await gestionnaireService.delete(deletingGestionnaire.id);
      toast.success('Gestionnaire deleted successfully');
      setDeletingGestionnaire(null);
      fetchGestionnaires();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to delete gestionnaire');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Gestionnaires</h1>
          <p className="text-surface-500 mt-1">Manage branch managers and team members</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Add Manager
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <SearchBar
          placeholder="Search by name, email, CIN, role..."
          onSearch={setSearchQuery}
        />
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={5} />
      ) : (
        <Table
          headers={['Name', 'Email', 'CIN', 'Role', 'Agence', 'Status', 'Actions']}
          isEmpty={filteredGestionnaires.length === 0}
          emptyMessage={
            searchQuery
              ? 'No managers match your search'
              : 'No gestionnaires found. Create your first one!'
          }
        >
          {filteredGestionnaires.map((g) => (
            <tr key={g.id} className="table-row-hover">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-700 text-xs font-bold">
                      {g.firstName?.[0]}{g.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-800">
                      {g.firstName} {g.lastName}
                    </p>
                    <p className="text-xs text-surface-400">{g.numTelephone}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-surface-600">{g.email}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-mono text-surface-500">{g.cin}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant="info" size="sm">{g.role}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-surface-600">
                  {g.agence?.libelle || '—'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={g.active ? 'success' : 'neutral'}>
                  {g.active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingGestionnaire(g)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeletingGestionnaire(g)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Create Modal */}
      <Modal
        title="Add New Manager"
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
        title="Edit Manager"
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
        title="Delete Manager"
        message={`Are you sure you want to delete ${deletingGestionnaire?.firstName} ${deletingGestionnaire?.lastName}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default GestionnairesPage;
