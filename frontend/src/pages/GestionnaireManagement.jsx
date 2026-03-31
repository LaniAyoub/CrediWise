import React, { useState, useEffect, useCallback } from 'react';
import { gestionnaireService } from '@/services/api.js';
import GestionnaireForm from '@/components/GestionnaireForm';
import { getErrorMessage } from '@/utils/validation.js';
import './GestionnaireManagement.css';

/**
 * Composant avancé pour la gestion complète des gestionnairesurlistes
 * Inclut: liste, recherche, pagination, ajout, modification, suppression
 */
const GestionnaireManagement = () => {
  // États
  const [gestionnairesList, setGestionnairesList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState('list');
  const [selectedGestionnaire, setSelectedGestionnaire] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    pageSize: 10,
  });

  // Charger la liste des gestionnairesurlistes
  const loadGestionnaires = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await gestionnaireService.getAllGestionnaires();
      const data = Array.isArray(response) ? response : response.data || [];
      setGestionnairesList(data);
      setPagination(prev => ({
        ...prev,
        total: Math.ceil(data.length / prev.pageSize),
      }));
    } catch (err) {
      setError(getErrorMessage(err));
      console.error('Erreur lors du chargement:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadGestionnaires();
  }, [loadGestionnaires]);

  // Filtrer la liste
  useEffect(() => {
    const filtered = gestionnairesList.filter(g => {
      const searchLower = searchTerm.toLowerCase();
      return (
        g.first_name?.toLowerCase().includes(searchLower) ||
        g.last_name?.toLowerCase().includes(searchLower) ||
        g.email?.toLowerCase().includes(searchLower) ||
        g.cin?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredList(filtered);
    setPagination(prev => ({
      ...prev,
      current: 1,
      total: Math.ceil(filtered.length / prev.pageSize),
    }));
  }, [searchTerm, gestionnairesList]);

  // Pagination
  const paginatedList = filteredList.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  // Ajouter
  const handleAddNew = () => {
    setSelectedGestionnaire(null);
    setCurrentPage('form');
  };

  // Modifier
  const handleEdit = (gestionnaire) => {
    setSelectedGestionnaire(gestionnaire);
    setCurrentPage('form');
  };

  // Supprimer
  const handleDelete = async (id) => {
    try {
      await gestionnaireService.deleteGestionnaire(id);
      setGestionnairesList(prev => prev.filter(g => g.id !== id));
      setDeleteConfirmId(null);
      setError(null);
    } catch (err) {
      setError(`Erreur lors de la suppression: ${getErrorMessage(err)}`);
    }
  };

  // Après succès du formulaire
  const handleFormSuccess = () => {
    setCurrentPage('list');
    loadGestionnaires();
  };

  // Retour à la liste
  const handleBack = () => {
    setCurrentPage('list');
  };

  return (
    <div className="gestionnaire-management">
      {currentPage === 'form' ? (
        <div className="form-wrapper">
          <button className="btn-back" onClick={handleBack}>
            ← Retour à la Liste
          </button>
          <GestionnaireForm
            onSuccess={handleFormSuccess}
            initialData={selectedGestionnaire}
          />
        </div>
      ) : (
        <div className="list-wrapper">
          {/* En-tête */}
          <div className="management-header">
            <h1>Gestion des Gestionnairesurlistes</h1>
            <div className="header-actions">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, CIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleAddNew}
              >
                + Ajouter
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Contenu */}
          {loading ? (
            <div className="loading">Chargement...</div>
          ) : filteredList.length === 0 ? (
            <div className="empty-state">
              <p>
                {searchTerm
                  ? 'Aucun résultat trouvé.'
                  : 'Aucun gestionnaire enregistré.'}
              </p>
              {!searchTerm && (
                <button
                  className="btn btn-primary"
                  onClick={handleAddNew}
                >
                  Créer le premier gestionnaire
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Tableau */}
              <div className="table-wrapper">
                <table className="gestionnaire-table">
                  <thead>
                    <tr>
                      <th>Prénom</th>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Téléphone</th>
                      <th>Statut</th>
                      <th className="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedList.map((gestionnaire) => (
                      <tr key={gestionnaire.id}>
                        <td>{gestionnaire.first_name}</td>
                        <td>{gestionnaire.last_name}</td>
                        <td className="email-cell">{gestionnaire.email}</td>
                        <td>
                          <span className="role-badge">
                            {gestionnaire.role}
                          </span>
                        </td>
                        <td>{gestionnaire.num_telephone}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              gestionnaire.is_active ? 'active' : 'inactive'
                            }`}
                          >
                            {gestionnaire.is_active ? '✓ Actif' : '✗ Inactif'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button
                            className="btn-icon edit"
                            onClick={() => handleEdit(gestionnaire)}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() =>
                              setDeleteConfirmId(gestionnaire.id)
                            }
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total > 1 && (
                <div className="pagination">
                  <button
                    disabled={pagination.current === 1}
                    onClick={() =>
                      setPagination(prev => ({
                        ...prev,
                        current: prev.current - 1,
                      }))
                    }
                  >
                    ← Précédent
                  </button>
                  <span className="page-info">
                    Page {pagination.current} sur {pagination.total}
                  </span>
                  <button
                    disabled={pagination.current === pagination.total}
                    onClick={() =>
                      setPagination(prev => ({
                        ...prev,
                        current: prev.current + 1,
                      }))
                    }
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer ce gestionnaire ?</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Annuler
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionnaireManagement;
