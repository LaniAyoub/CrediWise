# Guide d'Intégration Frontend-Backend

## 🔌 Configuration de la Connexion

### 1. Backend (Quarkus)

Assurez-vous que votre backend expose les endpoints:

```
GET  /gestionnaireResource              # Récupérer tous
POST /gestionnaireResource              # Créer
GET  /gestionnaireResource/{id}         # Récupérer un
PUT  /gestionnaireResource/{id}         # Mettre à jour
DELETE /gestionnaireResource/{id}       # Supprimer
GET  /roleResource                      # Récupérer les rôles
```

Ajoutez la configuration CORS dans `application.properties`:

```properties
quarkus.http.cors=true
quarkus.http.cors.origins=http://localhost:3000,http://localhost:5173
quarkus.http.cors.methods=GET,POST,PUT,DELETE,OPTIONS
quarkus.http.cors.exposed-headers=Content-Disposition
```

### 2. Frontend (React)

#### Option A: Proxy Vite (Développement)

```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
}
```

Puis appelez:
```javascript
// src/services/api.js
apiClient.post('/api/gestionnaireResource', data)
```

#### Option B: URL Direct (Production)

```javascript
// src/services/api.js
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  ...
});
```

## 🔐 Authentification Keycloak

### Configuration Côté Backend

```java
// Quarkus - pom.xml
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-oidc</artifactId>
</dependency>

<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-security-jpa</artifactId>
</dependency>
```

```properties
# application.properties
quarkus.oidc.auth-server-url=http://keycloak:8080/realms/creditwise
quarkus.oidc.client-id=creditwise-api
quarkus.oidc.credentials.secret=${KEYCLOAK_SECRET}
```

### Configuration Côté Frontend

Installez les dépendances:

```bash
npm install keycloak-js
```

Configurez dans `src/services/api.js`:

```javascript
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://keycloak:8080',
  realm: 'creditwise',
  clientId: 'creditwise-frontend'
});

keycloak.init({ onLoad: 'login-required' }).then((authenticated) => {
  if (authenticated) {
    apiClient.defaults.headers.common['Authorization'] = 
      `Bearer ${keycloak.token}`;
  }
});
```

## 📊 Structure des Réponses API

### Inscription réussie
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean.dupont@example.com",
  "cin": "12345678",
  "num_telephone": "+33612345678",
  "date_of_birth": "1990-05-15",
  "address": "123 Rue de Paris",
  "role": "FRONT_OFFICE",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Erreur de validation
```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "email": "Email already exists",
    "cin": "CIN already exists"
  }
}
```

## 🚀 Déploiement

### Docker Compose (Environnement complet)

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    image: creditwise-backend:latest
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: jdbc:postgresql://postgres:5432/creditwise
      KEYCLOAK_URL: http://keycloak:8080
    depends_on:
      - postgres

  frontend:
    image: creditwise-frontend:latest
    ports:
      - "3000:3000"
    environment:
      VITE_API_BASE_URL: http://backend:8080
    depends_on:
      - backend

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: creditwise
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  keycloak:
    image: keycloak/keycloak:latest
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8081:8080"

volumes:
  postgres_data:
```

### Docker Frontend

```dockerfile
# Dockerfile pour le frontend
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

## 🧪 Tests E2E

### Exemple avec Cypress

```javascript
// cypress/e2e/gestionnaire-form.cy.js
describe('Formulaire Gestionnaire', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('Crée un nouveau gestionnaire', () => {
    cy.contains('Ajouter un Gestionnaire').click();
    cy.get('#first_name').type('Jean');
    cy.get('#last_name').type('Dupont');
    cy.get('#email').type('jean@example.com');
    cy.get('#cin').type('12345678');
    cy.get('#num_telephone').type('0612345678');
    cy.get('#date_of_birth').type('1990-05-15');
    cy.get('#role').select('FRONT_OFFICE');
    cy.contains('Créer le Gestionnaire').click();
    
    cy.contains('créé avec succès').should('be.visible');
  });
});
```

## 🔄 Variables d'Environnement

### Fichier `.env` Frontend

```env
# API
VITE_API_BASE_URL=http://localhost:8080

# Keycloak
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=creditwise
VITE_KEYCLOAK_CLIENT_ID=creditwise-frontend

# Application
VITE_APP_TITLE=CrediWise
VITE_APP_VERSION=1.0.0
VITE_LOG_LEVEL=debug
```

## ✅ Checklist de Déploiement

- [ ] Backend testé et fonctionnel
- [ ] CORS configuré sur le backend
- [ ] Endpoints API confirmés
- [ ] Authentification Keycloak configurée (optionnel)
- [ ] Variables d'environnement définies
- [ ] Frontend construit (`npm run build`)
- [ ] Tests passés

## 📝 Logs et Dépannage

### Activer les logs
```javascript
// src/services/api.js
apiClient.interceptors.response.use(
  response => {
    console.log('API Response:', response);
    return response;
  },
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| 404 Not Found | Endpoint incorrect | Vérifier les URLs API |
| CORS Error | Config CORS manquante | Ajouter CORS au backend |
| 401 Unauthorized | Token expiré/manquant | Vérifier Keycloak |
| 409 Conflict | Email/CIN duppliqué | Vérifier en BD |

## 📚 Ressources

- [Documentation Quarkus](https://quarkus.io/)
- [Documentation React](https://react.dev/)
- [Documentation Axios](https://axios-http.com/)
- [Documentation Keycloak](https://www.keycloak.org/guides)
