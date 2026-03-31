import { REGEX } from '../constants';

/**
 * Valide un email
 * @param {string} email - Email à valider
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  return REGEX.EMAIL.test(email);
};

/**
 * Valide un numéro de téléphone
 * @param {string} phone - Numéro à valider
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  return REGEX.PHONE.test(phone);
};

/**
 * Valide un CIN
 * @param {string} cin - CIN à valider
 * @returns {boolean}
 */
export const isValidCIN = (cin) => {
  return REGEX.CIN.test(cin) && cin.length >= 5;
};

/**
 * Formate une date en format ISO (YYYY-MM-DD)
 * @param {Date|string} date - Date à formater
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Formate une date pour l'affichage (JJ/MM/YYYY)
 * @param {Date|string} date - Date à formater
 * @returns {string}
 */
export const formatDateDisplay = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Calcule l'âge à partir de la date de naissance
 * @param {Date|string} birthDate - Date de naissance
 * @returns {number}
 */
export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * Formate un numéro de téléphone pour l'affichage
 * @param {string} phone - Numéro brut
 * @returns {string}
 */
export const formatPhone = (phone) => {
  // Retire les espaces et caractères spéciaux
  const clean = phone.replace(/\D/g, '');
  
  // Format français: +33 6 12 34 56 78
  if (clean.startsWith('33')) {
    // Remplacer 33 au début par 0
    const formatted = '0' + clean.substring(2);
    return formatted.replace(/(\d{2})(?=\d)/g, '$1 ');
  }
  
  return phone;
};

/**
 * Valide les données d'un gestionnaire
 * @param {object} data - Données à valider
 * @returns {object} - {isValid, errors}
 */
export const validateGestionnaire = (data) => {
  const errors = {};

  if (!data.first_name?.trim()) {
    errors.first_name = 'Le prénom est requis';
  } else if (data.first_name.length < 2) {
    errors.first_name = 'Le prénom doit contenir au moins 2 caractères';
  }

  if (!data.last_name?.trim()) {
    errors.last_name = 'Le nom est requis';
  } else if (data.last_name.length < 2) {
    errors.last_name = 'Le nom doit contenir au moins 2 caractères';
  }

  if (!data.email?.trim()) {
    errors.email = 'L\'email est requis';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Email invalide';
  }

  if (!data.num_telephone?.trim()) {
    errors.num_telephone = 'Le téléphone est requis';
  } else if (!isValidPhone(data.num_telephone)) {
    errors.num_telephone = 'Numéro de téléphone invalide';
  }

  if (!data.cin?.trim()) {
    errors.cin = 'Le CIN est requis';
  } else if (!isValidCIN(data.cin)) {
    errors.cin = 'CIN invalide';
  }

  if (!data.date_of_birth) {
    errors.date_of_birth = 'La date de naissance est requise';
  } else if (calculateAge(data.date_of_birth) < 18) {
    errors.date_of_birth = 'Vous devez avoir au moins 18 ans';
  }

  if (!data.role) {
    errors.role = 'Le rôle est requis';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Obtient le message d'erreur API lisible
 * @param {Error} error - Erreur axios
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.statusText) {
    return error.response.statusText;
  }
  return error.message || 'Une erreur est survenue';
};

/**
 * Formate les données pour l'API
 * @param {object} data - Données du formulaire
 * @returns {object}
 */
export const formatDataForAPI = (data) => {
  return {
    ...data,
    date_of_birth: formatDate(data.date_of_birth),
    email: data.email.toLowerCase().trim(),
    num_telephone: data.num_telephone.trim(),
  };
};
