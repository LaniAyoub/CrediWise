import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajouter un intercepteur pour gérer les tokens d'authentification (Keycloak)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const gestionnaireService = {
  // Créer un nouveau gestionnaire
  createGestionnaire: (data) => 
    apiClient.post('/gestionnaireResource', data),

  // Récupérer tous les gestionnaires
  getAllGestionnaires: () => 
    apiClient.get('/gestionnaireResource'),

  // Récupérer un gestionnaire par ID
  getGestionnaireById: (id) => 
    apiClient.get(`/gestionnaireResource/${id}`),

  // Mettre à jour un gestionnaire
  updateGestionnaire: (id, data) => 
    apiClient.put(`/gestionnaireResource/${id}`, data),

  // Supprimer un gestionnaire
  deleteGestionnaire: (id) => 
    apiClient.delete(`/gestionnaireResource/${id}`),
};

export const roleService = {
  // Récupérer tous les rôles
  getAllRoles: () => 
    apiClient.get('/roleResource'),
};

export const agenceService = {
  // Récupérer toutes les agences
  getAllAgences: () => 
    apiClient.get('/agenceResource'),

  // Récupérer une agence par ID
  getAgenceById: (id) => 
    apiClient.get(`/agenceResource/${id}`),
};

export default apiClient;
