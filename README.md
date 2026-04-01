# CrediWise — Gestionnaire Platform

A full-stack credit management platform built with **Quarkus** (backend) and **React + TypeScript** (frontend).

---

## Project Structure

```
CrediWise/
├── backend/
│   └── gestionnaire/       # Quarkus REST API (Java 21)
├── frontend/               # React + Vite + TypeScript
├── Postman_Collection.json # API test collection
└── SECURITY_DOCUMENTATION.md
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Java | 21+ |
| Maven | 3.9+ (wrapper included) |
| Node.js | 18+ |
| PostgreSQL | 14+ |

---

## Backend Setup

### 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE gestionnaire_db;
CREATE USER admin WITH PASSWORD 'admin';
GRANT ALL PRIVILEGES ON DATABASE gestionnaire_db TO admin;
```

### 2. Configuration

Edit `backend/gestionnaire/src/main/resources/application.properties` if your DB credentials differ:

```properties
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/gestionnaire_db
quarkus.datasource.username=admin
quarkus.datasource.password=admin
```

### 3. Build & Run

```bash
cd backend/gestionnaire
./mvnw package -DskipTests
java -jar target/quarkus-app/quarkus-run.jar
```

Backend runs on **http://localhost:8080**

- Swagger UI: http://localhost:8080/q/swagger-ui
- OpenAPI spec: http://localhost:8080/q/openapi

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:3000**

---

## Default Credentials

| Email | Password | Role |
|-------|----------|------|
| `system@creditwise.com` | `ChangeMe123!` | TECH_USER |
| `admin@creditwise.com` | `ChangeMe123!` | SUPER_ADMIN |

---

## Role Permissions

| Endpoint | TECH_USER | SUPER_ADMIN |
|----------|-----------|-------------|
| Login | ✅ | ✅ |
| GET /api/gestionnaires | ✅ | ✅ |
| POST /api/gestionnaires | ✅ | ✅ |
| PUT /api/gestionnaires/{id} | ✅ | ✅ |
| DELETE /api/gestionnaires/{id} | ✅ | ✅ |
| PUT /api/gestionnaires/{id}/agence | ❌ | ✅ |
| GET /api/agences | ✅ | ✅ |
| GET /api/agences/{id} | ✅ | ✅ |
| POST /api/agences | ❌ | ✅ |
| PUT /api/agences/{id} | ❌ | ✅ |

---

## API Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login — returns JWT token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/health` | Health check |

### Gestionnaires
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gestionnaires` | List all managers |
| POST | `/api/gestionnaires` | Create a manager |
| PUT | `/api/gestionnaires/{id}` | Update a manager |
| PUT | `/api/gestionnaires/{id}/agence` | Move to another branch |
| DELETE | `/api/gestionnaires/{id}` | Delete a manager |

### Agences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agences` | List all branches |
| GET | `/api/agences/{id}` | Get branch by ID |
| POST | `/api/agences` | Create a branch |
| PUT | `/api/agences/{id}` | Update a branch |

---

## Tech Stack

**Backend**
- Quarkus 3.34.1
- Java 21
- Hibernate ORM + Panache
- PostgreSQL + Flyway
- SmallRye JWT
- BCrypt password hashing

**Frontend**
- React 19 + TypeScript
- Vite + Tailwind CSS
- React Hook Form + Zod
- Axios
