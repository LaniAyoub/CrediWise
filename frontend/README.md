# CrediWise Frontend

Interface React pour la gestion des gestionnairesurlistes, des rôles et des permissions dans le système de crédit CrediWise.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js >= 16.0.0
- npm ou yarn

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Construire pour la production
npm run build

# Aperçu de la production
npm run preview
```

Le serveur s'exécutera sur `http://localhost:3000`

## 📁 Structure du Projet

```
frontend/
├── src/
│   ├── components/
│   │   ├── GestionnaireForm.jsx       # Formulaire d'ajout/modification de gestionnaire
│   │   └── GestionnaireForm.css       # Styles du formulaire
│   ├── pages/
│   │   ├── GestionnairePage.jsx       # Page de gestion des gestionnaireслиis
│   │   └── GestionnairePage.css       # Styles de la page
│   ├── services/
│   │   └── api.js                     # Services API et configuration axios
│   ├── App.jsx                        # Composant racine
│   ├── App.css                        # Styles globaux de l'app
│   ├── index.css                      # CSS de réinitialisation
│   └── main.jsx                       # Point d'entrée React
├── index.html                         # Template HTML
├── package.json                       # Dépendances du projet
├── vite.config.js                     # Configuration Vite
└── README.md                          # Ce fichier
```

## 🛠️ Composants Principaux

### GestionnaireForm
Formulaire completo pour ajouter ou modifier un gestionnaire.

**Props:**
- `onSuccess` (function): Callback appelé après une soumission réussie
- `initialData` (object): Données initiales pour la modification

**Champs du formulaire:**
- Prénom et Nom
- Email (validé)
- CIN (Carte d'Identité Nationale)
- Téléphone
- Date de Naissance
- Adresse
- Rôle (dropdown)
- Statut Actif/Inactif

### GestionnairePage
Page de gestion complète avec liste et formulaire.

## 🔌 Intégration avec le Backend

### Configuration API

L'application communique avec le backend via:
- **Base URL**: `http://localhost:8080`
- **Endpoints**: 
  - `POST /gestionnaireResource` - Créer un gestionnaire
  - `GET /gestionnaireResource` - Récupérer tous les gestionnairesoauth
  - `GET /gestionnaireResource/{id}` - Récupérer un gestionnaire
  - `PUT /gestionnaireResource/{id}` - Mettre à jour un gestionnaire
  - `DELETE /gestionnaireResource/{id}` - Supprimer un gestionnaire
  - `GET /roleResource` - Récupérer tous les rôles

### Configuration du Proxy

Le fichier `vite.config.js` configure un proxy pour les appels API:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

## 🎨 Styles

Le projet utilise:
- **CSS Vanilla** pour une légèreté maximale
- **Design Responsive** - Mobile first
- **Variables CSS** pour la personnalisation des couleurs
- **Animations fluides** pour une meilleure UX

## ✅ Validation des Formulaires

- Validation côté client avec `react-hook-form`
- Validation des emails (format)
- Validation des numéros de téléphone
- Vérification de l'âge minimum (18 ans)
- Limites de caractères conformes à la BD

## 🔒 Authentification

L'application prend en charge les tokens JWT pour Keycloak:
- Les tokens sont stockés dans `localStorage`
- Les tokens sont envoyés dans l'en-tête `Authorization`

Pour configurer l'authentification Keycloak, modifier `src/services/api.js`

## 📱 Responsive Design

L'interface est optimisée pour:
- Desktop (> 1024px)
- Tablet (768px - 1024px)
- Mobile (< 768px)

## 🐛 Gestion des Erreurs

- Messages d'erreur clairs et localisés
- Gestion des erreurs réseau
- Notifications de succès/erreur

## 📦 Dépendances Principales

- **React 18.2**: Framework UI
- **Vite 5**: Build tool/dev server
- **Axios 1.6**: Client HTTP
- **react-hook-form 7.48**: Gestion des formulaires
- **date-fns 2.30**: Manipulation des dates

## 🚀 Déploiement

Pour déployer en production:

```bash
npm run build
```

Les fichiers de distribution seront dans le dossier `dist/`

## 📝 Notes de Développement

- Les appels API utilisent async/await
- Error handling avec try/catch
- Gestion du loading state lors des requêtes
- Reset du formulaire après succès

## 🤝 Support

Pour les questions ou les bugs, consultez la documentation du backend CrediWise.
