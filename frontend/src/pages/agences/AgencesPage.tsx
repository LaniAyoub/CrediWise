import React, { useState, useEffect, useMemo } from 'react';
import { agenceService } from '@/services/agence.service';
import type { Agence, AgenceCreateRequest, AgenceUpdateRequest } from '@/types/agence.types';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import SearchBar from '@/components/ui/SearchBar';
import AgenceForm from '@/components/forms/AgenceForm';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';

const AgencesPage = () => {
  const [agences, setAgences] = useState<Agence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAgence, setEditingAgence] = useState<Agence | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAgences = async () => {
    try {
      const response = await agenceService.getAll();
      setAgences(response.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgences();
  }, []);

  const filteredAgences = useMemo(() => {
    if (!searchQuery) return agences;
    const q = searchQuery.toLowerCase();
    return agences.filter(
      (a) =>
        a.idBranch.toLowerCase().includes(q) ||
        a.libelle.toLowerCase().includes(q) ||
        (a.wording && a.wording.toLowerCase().includes(q))
    );
  }, [agences, searchQuery]);

  const handleCreate = async (data: AgenceCreateRequest) => {
    setIsSubmitting(true);
    try {
      await agenceService.create(data);
      toast.success('Agence created successfully');
      setIsCreateModalOpen(false);
      fetchAgences();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create agence');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: AgenceUpdateRequest & { idBranch?: string }) => {
    if (!editingAgence) return;
    setIsSubmitting(true);
    try {
      const updateData: AgenceUpdateRequest = {
        libelle: data.libelle,
        wording: data.wording,
        isActive: data.isActive,
      };
      await agenceService.update(editingAgence.idBranch, updateData);
      toast.success('Agence updated successfully');
      setEditingAgence(null);
      fetchAgences();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update agence');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Agences</h1>
          <p className="text-surface-500 mt-1">Manage your banking branches</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Add Agence
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <SearchBar
          placeholder="Search by ID, name, or description..."
          onSearch={setSearchQuery}
        />
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={5} />
      ) : (
        <Table
          headers={['Branch ID', 'Label', 'Description', 'Status', 'Actions']}
          isEmpty={filteredAgences.length === 0}
          emptyMessage={searchQuery ? 'No agences match your search' : 'No agences found. Create your first one!'}
        >
          {filteredAgences.map((agence) => (
            <tr key={agence.idBranch} className="table-row-hover">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-mono font-semibold text-surface-800">
                  {agence.idBranch}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-medium text-surface-700">{agence.libelle}</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-surface-500 line-clamp-1">
                  {agence.wording || '—'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={agence.active ? 'success' : 'neutral'}>
                  {agence.active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAgence(agence)}
                >
                  Edit
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Create Modal */}
      <Modal
        title="Create New Agence"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <AgenceForm
          onSubmit={handleCreate}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Agence"
        isOpen={!!editingAgence}
        onClose={() => setEditingAgence(null)}
      >
        {editingAgence && (
          <AgenceForm
            onSubmit={handleUpdate}
            defaultValues={editingAgence}
            isLoading={isSubmitting}
            isEdit
          />
        )}
      </Modal>
    </div>
  );
};

export default AgencesPage;
