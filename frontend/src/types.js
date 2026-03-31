// Types/Interfaces pour la documentation TypeScript
// Vous pouvez utiliser ces interfaces même en JS pour la documentation JSDoc

/**
 * @typedef {Object} Gestionnaire
 * @property {string} id - UUID du gestionnaire (Keycloak user ID)
 * @property {string} first_name - Prénom
 * @property {string} last_name - Nom
 * @property {string} email - Email unique
 * @property {string} cin - Numéro de CIN unique
 * @property {string} num_telephone - Numéro de téléphone
 * @property {string} date_of_birth - Date de naissance (YYYY-MM-DD)
 * @property {string} address - Adresse
 * @property {string} role - Code du rôle (ex: FRONT_OFFICE, CRO, etc.)
 * @property {boolean} is_active - Statut actif/inactif
 * @property {string} created_at - Date de création
 * @property {string} updated_at - Date de dernière mise à jour
 * @property {string} created_by - UUID du créateur
 * @property {string} updated_by - UUID du dernier modificateur
 * @property {number} version - Version pour optimistic locking
 */

/**
 * @typedef {Object} Role
 * @property {number} id - Identifiant du rôle
 * @property {string} code - Code du rôle (FRONT_OFFICE, CRO, etc.)
 * @property {string} label - Libellé du rôle
 * @property {string} description - Description
 * @property {boolean} is_active - Actif ?
 * @property {string} created_at - Date de création
 * @property {string} updated_at - Date de mise à jour
 */

/**
 * @typedef {Object} APIResponse
 * @property {any} data - Données retournées
 * @property {number} status - Code HTTP
 * @property {string} statusText - Message de statut
 */

/**
 * @typedef {Object} GestionnaireFormProps
 * @property {Function} [onSuccess] - Callback après soumission réussie
 * @property {Gestionnaire} [initialData] - Données pour modification
 */

/**
 * @typedef {Object} FormError
 * @property {string} [first_name] - Erreur prénom
 * @property {string} [last_name] - Erreur nom
 * @property {string} [email] - Erreur email
 * @property {string} [cin] - Erreur CIN
 * @property {string} [num_telephone] - Erreur téléphone
 * @property {string} [date_of_birth] - Erreur date
 * @property {string} [address] - Erreur adresse
 * @property {string} [role] - Erreur rôle
 */

export {};
