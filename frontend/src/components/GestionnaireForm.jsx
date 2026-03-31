import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { gestionnaireService, roleService, agenceService } from '@/services/api.js';
import './GestionnaireForm.css';

const GestionnaireForm = ({ onSuccess, initialData = null }) => {
  const [roles, setRoles] = useState([]);
  const [agences, setAgences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: initialData || {
      first_name: '',
      last_name: '',
      email: '',
      cin: '',
      num_telephone: '',
      date_of_birth: '',
      address: '',
      role: 'FRONT_OFFICE',
      agence: '',
      is_active: true,
    },
  });

  // Charger les rôles et agences disponibles
  useEffect(() => {
    const fetchData = async () => {
      try {
        const rolesResponse = await roleService.getAllRoles();
        setRoles(rolesResponse.data);
        
        const agencesResponse = await agenceService.getAllAgences();
        setAgences(agencesResponse.data);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setRoles([]);
        setAgences([]);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const dataToSubmit = {
        ...formData,
        // Convertir la date au format ISO si elle existe
        date_of_birth: formData.date_of_birth 
          ? format(new Date(formData.date_of_birth), 'yyyy-MM-dd')
          : null,
      };

      if (initialData?.id) {
        // Mise à jour
        await gestionnaireService.updateGestionnaire(initialData.id, dataToSubmit);
        setSuccessMessage('Gestionnaire mis à jour avec succès!');
      } else {
        // Création
        await gestionnaireService.createGestionnaire(dataToSubmit);
        setSuccessMessage('Gestionnaire créé avec succès!');
        reset();
      }

      // Appeler le callback de succès si fourni
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Erreur: ${errorMessage}`);
      console.error('Erreur lors de la soumission du formulaire:', err);
    } finally {
      setLoading(false);
    }
  };

  const isActive = watch('is_active');

  return (
    <div className="gestionnaire-form-container">
      <div className="form-header">
        <h2>{initialData ? 'Modifier le Gestionnaire' : 'Ajouter un Nouveau Gestionnaire'}</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="gestionnaire-form">
        {/* Section Informations Personnelles */}
        <fieldset className="form-section">
          <legend>Informations Personnelles</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">Prénom *</label>
              <input
                id="first_name"
                type="text"
                placeholder="Ex: Jean"
                {...register('first_name', {
                  required: 'Le prénom est requis',
                  minLength: {
                    value: 2,
                    message: 'Le prénom doit contenir au moins 2 caractères',
                  },
                  maxLength: {
                    value: 100,
                    message: 'Le prénom ne peut pas dépasser 100 caractères',
                  },
                })}
                className={errors.first_name ? 'input-error' : ''}
              />
              {errors.first_name && (
                <span className="error-message">{errors.first_name.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Nom *</label>
              <input
                id="last_name"
                type="text"
                placeholder="Ex: Dupont"
                {...register('last_name', {
                  required: 'Le nom est requis',
                  minLength: {
                    value: 2,
                    message: 'Le nom doit contenir au moins 2 caractères',
                  },
                  maxLength: {
                    value: 100,
                    message: 'Le nom ne peut pas dépasser 100 caractères',
                  },
                })}
                className={errors.last_name ? 'input-error' : ''}
              />
              {errors.last_name && (
                <span className="error-message">{errors.last_name.message}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date_of_birth">Date de Naissance *</label>
              <input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth', {
                  required: 'La date de naissance est requise',
                  validate: (value) => {
                    const age = new Date().getFullYear() - new Date(value).getFullYear();
                    return age >= 18 || 'Vous devez avoir au moins 18 ans';
                  },
                })}
                className={errors.date_of_birth ? 'input-error' : ''}
              />
              {errors.date_of_birth && (
                <span className="error-message">{errors.date_of_birth.message}</span>
              )}
            </div>
          </div>
        </fieldset>

        {/* Section Informations de Contact */}
        <fieldset className="form-section">
          <legend>Informations de Contact</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                placeholder="Ex: jean.dupont@example.com"
                {...register('email', {
                  required: 'L\'email est requis',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email invalide',
                  },
                  maxLength: {
                    value: 255,
                    message: 'L\'email ne peut pas dépasser 255 caractères',
                  },
                })}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && (
                <span className="error-message">{errors.email.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="num_telephone">Téléphone *</label>
              <input
                id="num_telephone"
                type="tel"
                placeholder="Ex: +33 6 12 34 56 78"
                {...register('num_telephone', {
                  required: 'Le téléphone est requis',
                  pattern: {
                    value: /^[\d+\s\-()]{10,20}$/,
                    message: 'Numéro de téléphone invalide',
                  },
                  maxLength: {
                    value: 20,
                    message: 'Le téléphone ne peut pas dépasser 20 caractères',
                  },
                })}
                className={errors.num_telephone ? 'input-error' : ''}
              />
              {errors.num_telephone && (
                <span className="error-message">{errors.num_telephone.message}</span>
              )}
            </div>
          </div>
        </fieldset>

        {/* Section Documents et Identifiction */}
        <fieldset className="form-section">
          <legend>Identification</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cin">CIN *</label>
              <input
                id="cin"
                type="text"
                placeholder="Ex: 12345678"
                {...register('cin', {
                  required: 'Le CIN est requis',
                  minLength: {
                    value: 5,
                    message: 'Le CIN doit contenir au moins 5 caractères',
                  },
                  maxLength: {
                    value: 20,
                    message: 'Le CIN ne peut pas dépasser 20 caractères',
                  },
                })}
                className={errors.cin ? 'input-error' : ''}
              />
              {errors.cin && (
                <span className="error-message">{errors.cin.message}</span>
              )}
            </div>
          </div>
        </fieldset>

        {/* Section Adresse */}
        <fieldset className="form-section">
          <legend>Adresse</legend>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="address">Adresse</label>
              <textarea
                id="address"
                placeholder="Ex: 123 Rue de la Paix, 75000 Paris"
                {...register('address', {
                  maxLength: {
                    value: 500,
                    message: 'L\'adresse ne peut pas dépasser 500 caractères',
                  },
                })}
                className={errors.address ? 'input-error' : ''}
                rows={3}
              />
              {errors.address && (
                <span className="error-message">{errors.address.message}</span>
              )}
            </div>
          </div>
        </fieldset>

        {/* Section Agence */}
        <fieldset className="form-section">
          <legend>Agence</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="agence">Agence *</label>
              <select
                id="agence"
                {...register('agence', {
                  required: 'L\'agence est requise',
                })}
                className={errors.agence ? 'input-error' : ''}
              >
                <option value="">-- Sélectionner une agence --</option>
                {agences.map((agence) => (
                  <option key={agence.id} value={agence.id}>
                    {agence.nom}
                  </option>
                ))}
              </select>
              {errors.agence && (
                <span className="error-message">{errors.agence.message}</span>
              )}
            </div>
          </div>
        </fieldset>

        {/* Section Rôle et Activation */}
        <fieldset className="form-section">
          <legend>Rôle et Statut</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Rôle *</label>
              <select
                id="role"
                {...register('role', {
                  required: 'Le rôle est requis',
                })}
                className={errors.role ? 'input-error' : ''}
              >
                <option value="">-- Sélectionner un rôle --</option>
                {roles.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <span className="error-message">{errors.role.message}</span>
              )}
            </div>

            <div className="form-group checkbox-group">
              <label htmlFor="is_active" className="checkbox-label">
                <input
                  id="is_active"
                  type="checkbox"
                  {...register('is_active')}
                  className="checkbox-input"
                />
                <span className={`checkbox-status ${isActive ? 'active' : 'inactive'}`}>
                  {isActive ? 'Actif' : 'Inactif'}
                </span>
              </label>
            </div>
          </div>
        </fieldset>

        {/* Boutons d'Action */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Traitement en cours...' : (initialData ? 'Mettre à Jour' : 'Créer le Gestionnaire')}
          </button>
          <button
            type="reset"
            className="btn btn-secondary"
            onClick={() => {
              reset();
              setError(null);
              setSuccessMessage(null);
            }}
          >
            Réinitialiser
          </button>
        </div>
      </form>
    </div>
  );
};

export default GestionnaireForm;
