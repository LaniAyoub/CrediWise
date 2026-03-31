# Guide d'Utilisation - Formulaire GestionnaireForm

## 📋 Vue d'ensemble

Le composant `GestionnaireForm` est un formulaire React complet pour créer ou modifier un gestionnaire. Il inclut la validation côté client, la gestion des erreurs, et l'intégration avec l'API backend.

## 🎯 Utilisation Basique

### Importation

```jsx
import GestionnaireForm from './components/GestionnaireForm';
```

### Ajout d'un nouveau gestionnaire

```jsx
<GestionnaireForm onSuccess={() => console.log('Gestionnaire créé!')} />
```

### Modification d'un gestionnaire existant

```jsx
const gestionnaire = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  first_name: 'Jean',
  last_name: 'Dupont',
  email: 'jean.dupont@example.com',
  cin: '12345678',
  num_telephone: '+33612345678',
  date_of_birth: '1990-05-15',
  address: '123 Rue de Paris',
  role: 'FRONT_OFFICE',
  is_active: true,
};

<GestionnaireForm 
  onSuccess={() => console.log('Gestionnaire mis à jour!')}
  initialData={gestionnaire}
/>
```

## 📦 Props

### `onSuccess` (optionnel)
- **Type**: `Function`
- **Description**: Callback appelé après une soumission réussie
- **Exemple**: 
  ```jsx
  <GestionnaireForm onSuccess={() => navigate('/gestionnairesList')} />
  ```

### `initialData` (optionnel)
- **Type**: `Object`
- **Description**: Données initiales pour pré-remplir le formulaire (mode modification)
- **Exemple**:
  ```jsx
  <GestionnaireForm initialData={gestionnaireData} />
  ```

## 📝 Structure des Données

### Format du formulaire
```javascript
{
  first_name: string,              // Prénom (requis, 2-100 caractères)
  last_name: string,               // Nom (requis, 2-100 caractères)
  email: string,                   // Email (requis, format valide)
  cin: string,                     // CIN (requis, 5-20 caractères)
  num_telephone: string,           // Téléphone (requis, 10-20 caractères)
  date_of_birth: string,           // Date ISO (YYYY-MM-DD, requis)
  address: string,                 // Adresse (optionnel, max 500 caractères)
  role: string,                    // Code du rôle (requis)
  is_active: boolean               // Statut (défaut: true)
}
```

## 🎨 Customization

### Modifier les styles
Créez votre propre CSS et surchargez les classes:

```css
/* Votre fichier CSS */
.gestionnaire-form-container {
  max-width: 1200px;
  background: #your-color;
}

.form-section legend {
  color: #your-color;
}
```

### Modifier les messages

Modifiez les messages dans `src/components/GestionnaireForm.jsx` (cherchez `register(...)`).

## 🔗 Intégration dans une page

### Exemple complet - Page de gestion

```jsx
import React, { useState } from 'react';
import GestionnaireForm from '../components/GestionnaireForm';

function GestionnaireManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingGestionnaire, setEditingGestionnaire] = useState(null);

  const handleAddNew = () => {
    setEditingGestionnaire(null);
    setShowForm(true);
  };

  const handleEdit = (gestionnaire) => {
    setEditingGestionnaire(gestionnaire);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    // Recharger la liste des gestionnairesurlistes
    refetchGestionnaires();
  };

  return (
    <div>
      {showForm ? (
        <GestionnaireForm 
          onSuccess={handleFormSuccess}
          initialData={editingGestionnaire}
        />
      ) : (
        <button onClick={handleAddNew}>+ Ajouter Gestionnaire</button>
      )}
    </div>
  );
}
```

## ✅ Validation

Le formulaire valide automatiquement:

### Prénom/Nom
- ✓ Non vide
- ✓ Minimum 2 caractères
- ✓ Maximum 100 caractères

### Email
- ✓ Format email valide
- ✓ Maximum 255 caractères
- ✓ Unique en base de données

### Téléphone
- ✓ Format valide (+33, 0, ou format international)
- ✓ Entre 10 et 20 caractères

### CIN
- ✓ 5 à 20 caractères
- ✓ Alphanumériques uniquement
- ✓ Unique en base de données

### Date de Naissance
- ✓ Format date valide
- ✓ Âge minimum: 18 ans

### Rôle
- ✓ Sélectionné dans la liste

## 🛠️ API Utilisée

Le formulaire appelle ces endpoints:

### Créer (POST)
```
POST /gestionnaireResource
Content-Type: application/json

{
  "first_name": "Jean",
  "last_name": "Dupont",
  ...
}
```

### Mettre à jour (PUT)
```
PUT /gestionnaireResource/{id}
Content-Type: application/json

{
  "first_name": "Jean",
  ...
}
```

### Récupérer les rôles (GET)
```
GET /roleResource
```

## 🚨 Gestion des Erreurs

Le formulaire affiche les erreurs de manière claire:

- **Erreurs de validation**: Affichées sous chaque champ
- **Erreurs serveur**: Affichées en banner en haut du formulaire
- **Messages de succès**: Affichage temporaire après succès

## 🌐 Support de l'Internationalisation

Les labels et messages sont en français. Pour changer de langue:

1. Modifiez les textes dans le composant
2. Créez un fichier de traductions
3. Utilisez React Context ou i18n

## 📱 Responsive

Le formulaire est responsive sur tous les appareils:
- Desktop (> 1024px)
- Tablet (768px - 1024px)
- Mobile (< 768px)

## 🔐 Sécurité

- Validation côté client et serveur
- Trimming des espaces
- Email en minuscules
- Token JWT pour l'authentification
- CORS configuré sur le backend

## 🐛 Dépannage

### Le formulaire ne soumet pas
- Vérifiez la console pour les erreurs
- Assurez-vous que le backend fonctionne
- Vérifiez les codes CORS

### Les rôles ne s'affichent pas
- Assurez-vous que `/roleResource` retourne des données
- Vérifiez la structure: `[{ code: 'ROLE_CODE', label: 'Rôle Label' }]`

### Erreur 409 Conflict on Email/CIN
- L'email ou le CIN existe déjà
- Vérifiez en BD avant soumission

## 📚 Exemples Avancés

### Avec validation personnalisée

```jsx
<GestionnaireForm 
  onSuccess={() => refreshList()}
  initialData={gestionnaire}
/>
```

### Modal Form

```jsx
import Modal from './Modal';

<Modal isOpen={isOpen}>
  <GestionnaireForm onSuccess={() => closeModal()} />
</Modal>
```

### Avec loading global

```jsx
const [loading, setLoading] = useState(false);

<GestionnaireForm 
  onSuccess={() => {
    setLoading(false);
    navigate('/gestionnairesList');
  }}
/>
```

## 📖 Référence complète

Pour plus de détails, consultez:
- [Service API](./src/services/api.js)
- [Validations](./src/utils/validation.js)
- [Constantes](./src/constants/index.js)
