import React, { useState } from 'react';
import GestionnaireForm from '@/components/GestionnaireForm';
import './GestionnairePage.css';

const GestionnairePage = () => {
  const [currentPage, setCurrentPage] = useState('list');
  const [gestionnaireList, setGestionnaireList] = useState([]);
  const [selectedGestionnaire, setSelectedGestionnaire] = useState(null);

  const handleFormSuccess = () => {
    // Recharger la liste après l'ajout/modification
    setCurrentPage('list');
    // Vous pouvez ajouter ici un appel pour recharger la liste des gestionnaireList
  };

  const handleAddNew = () => {
    setSelectedGestionnaire(null);
    setCurrentPage('form');
  };

  const handleEdit = (gestionnaire) => {
    setSelectedGestionnaire(gestionnaire);
    setCurrentPage('form');
  };

  const handleBack = () => {
    setCurrentPage('list');
    setSelectedGestionnaire(null);
  };

  return (
    <div className="gestionnaire-page">
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
          <div className="page-header">
            <h1>Gestion des Gestionnaires</h1>
            <button 
              className="btn btn-primary"
              onClick={handleAddNew}
            >
              + Ajouter un Gestionnaire
            </button>
          </div>

          {gestionnaireList.length === 0 ? (
            <div className="empty-state">
              <p>Aucun gestionnaire trouvé.</p>
              <button 
                className="btn btn-primary"
                onClick={handleAddNew}
              >
                Créer le premier gestionnaire
              </button>
            </div>
          ) : (
            <table className="gestionnaire-table">
              <thead>
                <tr>
                  <th>Prénom</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {gestionnaireList.map((gestionnaire) => (
                  <tr key={gestionnaire.id}>
                    <td>{gestionnaire.first_name}</td>
                    <td>{gestionnaire.last_name}</td>
                    <td>{gestionnaire.email}</td>
                    <td>
                      <span className="role-badge">{gestionnaire.role}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${gestionnaire.is_active ? 'active' : 'inactive'}`}>
                        {gestionnaire.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="actions">
                      <button 
                        className="btn-icon edit"
                        onClick={() => handleEdit(gestionnaire)}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon delete"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default GestionnairePage;
