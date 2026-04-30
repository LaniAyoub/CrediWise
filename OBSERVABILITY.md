# Observability — OpenTelemetry + SigNoz

Guide complet pour reproduire l'intégration OpenTelemetry + SigNoz sur le microservice `gestionnaire`.

---

## Table des matières

1. [Prérequis](#prérequis)
2. [Cloner le projet](#cloner-le-projet)
3. [Installer et démarrer SigNoz](#installer-et-démarrer-signoz)
4. [Démarrer l'infrastructure (PostgreSQL)](#démarrer-linfrastructure-postgresql)
5. [Démarrer le microservice gestionnaire](#démarrer-le-microservice-gestionnaire)
6. [Vérifier que tout fonctionne](#vérifier-que-tout-fonctionne)
7. [Ce qui est observable dans SigNoz](#ce-qui-est-observable-dans-signoz)
8. [Architecture technique](#architecture-technique)
9. [Fichiers modifiés et créés](#fichiers-modifiés-et-créés)

---

## Prérequis

Installer les outils suivants avant de commencer :

| Outil | Version minimale | Lien |
|-------|-----------------|------|
| Java JDK | 21 | https://adoptium.net |
| Maven | 3.9+ | https://maven.apache.org |
| Docker Desktop | 4.x | https://www.docker.com/products/docker-desktop |
| Git | 2.x | https://git-scm.com |

Vérifier l'installation :
```bash
java -version      # doit afficher 21
mvn -version       # doit afficher 3.9+
docker -version    # doit afficher 4.x
git --version
```

---

## Cloner le projet

```bash
git clone https://github.com/<ton-username>/CrediWise.git
cd CrediWise
```

---

## Installer et démarrer SigNoz

SigNoz est la plateforme d'observabilité. Elle reçoit les traces, logs et métriques.

### Étape 1 — Cloner le repo officiel SigNoz

```bash
# Cloner dans ton home directory (PAS dans le dossier CrediWise)
cd ~
git clone https://github.com/SigNoz/signoz.git
cd signoz/deploy/docker
docker-compose up -d```

### Étape 2 — Copier la configuration OTel Collector

Le fichier `otel-collector-config.yaml` à la racine du projet CrediWise contient déjà toute la configuration nécessaire (scrape jobs pour gestionnaire, client, nouvelle_demande + docker stats + exporters ClickHouse).

**Copie-le dans ton installation SigNoz :**

```bash
# Windows
copy otel-collector-config.yaml %USERPROFILE%\signoz\deploy\docker\otel-collector-config.yaml

# Linux / Mac
cp otel-collector-config.yaml ~/signoz/deploy/docker/otel-collector-config.yaml
```

> **Linux uniquement** — `host.docker.internal` n'existe pas par défaut. Après la copie, remplace `host.docker.internal` par l'IP gateway Docker dans le yaml :
> ```bash
> ip route show default | awk '{print $3}'
> # Exemple : 172.17.0.1
> ```
> ```bash
> sed -i 's/host.docker.internal/172.17.0.1/g' ~/signoz/deploy/docker/otel-collector-config.yaml
> ```

### Étape 3 — Démarrer SigNoz

```bash
cd ~/signoz/deploy/docker
docker-compose up -d
```

Attendre ~60 secondes que tous les containers démarrent, puis ouvrir :
```
http://localhost:8080
```

Créer un compte administrateur lors du premier accès.

### Vérifier que SigNoz est opérationnel

```bash
docker ps | grep signoz
# Doit afficher : signoz-frontend, signoz-query-service, signoz-otel-collector, signoz-clickhouse
```

---

## Démarrer l'infrastructure (PostgreSQL)

Depuis la racine du projet CrediWise :

```bash
cd ~/CrediWise
docker-compose up -d
```

Cela démarre PostgreSQL pour tous les microservices (ports 5432, 5433, 5434, 5435) et pgAdmin.

Vérifier :
```bash
docker ps | grep postgres
```

---

## Démarrer le microservice gestionnaire

### Étape 1 — Configurer les variables d'environnement (optionnel)

Le fichier `backend/gestionnaire/src/main/resources/application.properties` contient déjà les valeurs par défaut pour le développement local. Aucune modification nécessaire.

Si tu veux personnaliser :
```properties
quarkus.datasource.username=admin
quarkus.datasource.password=admin
quarkus.otel.exporter.otlp.endpoint=http://localhost:4317
```

### Étape 2 — Lancer en mode développement

```bash
cd backend/gestionnaire
./mvnw quarkus:dev
```

> **Windows** : utiliser `mvnw.cmd quarkus:dev`

Le service démarre sur **http://localhost:8090**

Swagger UI disponible sur : http://localhost:8090/q/swagger-ui

### Étape 3 — Vérifier le démarrage

Dans les logs, chercher ces lignes confirmant que OTel est connecté :

```
INFO  [io.qua.ote] OpenTelemetry initialized
INFO  [io.qua.fly] Flyway migration done. Successfully applied 5 migrations
```

---

## Vérifier que tout fonctionne

### 1. Tester l'endpoint Prometheus

```bash
curl http://localhost:8090/q/metrics | grep auth
```

Doit retourner des lignes comme :
```
# TYPE auth_active_sessions gauge
auth_active_sessions 0.0
```

### 2. Tester un login

```bash
curl -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crediwise.com","password":"votre_password"}'
```

### 3. Vérifier dans SigNoz

Ouvrir **http://localhost:8080** et vérifier les 3 onglets :

| Onglet | Ce qu'on cherche | Délai |
|--------|-----------------|-------|
| **Services** | `gestionnaire` visible avec traces | Immédiat |
| **Logs → Logs Explorer** | `auth.event = LOGIN` | Immédiat |
| **Metrics** | `auth_login_total` | ~15 secondes |

---

## Ce qui est observable dans SigNoz

### Traces (Services tab)

Toutes les routes HTTP sont automatiquement tracées :
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/gestionnaires`
- etc.

### Logs structurés (Logs Explorer)

Filtres MDC disponibles après un login/logout :

```
auth.event        = LOGIN | LOGOUT | LOGIN_FAILED
auth.status       = SUCCESS | FAILED
auth.user_role    = SUPER_ADMIN | GESTIONNAIRE | ...
auth.ip_address   = 192.168.x.x
auth.browser      = Chrome | Firefox | Edge | Safari
auth.device_type  = DESKTOP | MOBILE | TABLET
auth.os           = Windows | macOS | Linux | Android | iOS
auth.agency_id    = 100 | 200 | ...
auth.agency_name  = Agence Centrale | ...
auth.response_time_ms > 500
auth.trace_id     = <id>   → navigue vers la trace correspondante
```

### Métriques (Metrics tab)

| Métrique | Description | Tags |
|----------|-------------|------|
| `auth_login_total` | Tentatives de login | status, role, agency_id |
| `auth_login_failed_total` | Echecs de login | reason |
| `auth_logout_total` | Déconnexions | role |
| `auth_login_duration_ms_seconds` | Latence login (p50/p95/p99) | status |
| `auth_active_sessions` | Sessions actives en temps réel | — |
| `http_server_requests_seconds` | Toutes les routes HTTP | method, uri, status |
| `jvm_memory_used_bytes` | Mémoire JVM | area |
| `jvm_threads_live_threads` | Threads actifs | — |
| `system_cpu_usage` | CPU | — |

### Persistance PostgreSQL

Chaque event login/logout est aussi stocké dans la table `auth_events` pour reporting métier :

```sql
SELECT event_type, status, username, ip_address, device_type,
       browser, agency_id, response_time_ms, trace_id, event_timestamp
FROM auth_events
ORDER BY event_timestamp DESC
LIMIT 20;
```

---

## Architecture technique

```
┌─────────────────────────────────────────────────────────────┐
│                    gestionnaire (port 8090)                  │
│                                                             │
│  AuthRequestFilter ──► AuthRequestContext (IP, UA, timing) │
│         │                                                   │
│  AuthResource ──► AuthEventService                          │
│                        │                                    │
│                        ├── persist() ──────────────────────►│ PostgreSQL
│                        │                                    │ auth_events
│                        ├── emitLog() [MDC attributes]       │
│                        │   └── OTel Log Bridge              │
│                        │                                    │
│                        └── AppMetrics [Micrometer]          │
│                            └── /q/metrics (Prometheus)      │
└───────────────┬─────────────────────────┬───────────────────┘
                │ OTLP gRPC :4317         │ HTTP scrape :15s
                ▼                         ▼
        ┌───────────────────────────────────────┐
        │         signoz-otel-collector          │
        │  receivers: otlp + prometheus          │
        │  exporters: clickhouse                 │
        └──────────────┬────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   ClickHouse    │
              │  signoz_traces  │
              │  signoz_logs    │
              │  signoz_metrics │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   SigNoz UI     │
              │  :8080          │
              │  Services       │
              │  Logs Explorer  │
              │  Metrics        │
              └─────────────────┘
```

---

## Fichiers modifiés et créés

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `backend/gestionnaire/pom.xml` | Ajout `quarkus-opentelemetry` + `quarkus-micrometer-registry-prometheus` |
| `backend/gestionnaire/src/main/resources/application.properties` | Port 8090, OTel config, Micrometer/Prometheus, exclusion SQL Hibernate |
| `backend/gestionnaire/src/main/java/org/acme/resource/AuthResource.java` | Logging structuré sur login/logout, délégation au filter |
| `backend/gestionnaire/src/main/java/org/acme/service/AuthEventService.java` | MDC attributes, intégration AppMetrics |
| `frontend/src/services/api.ts` | baseURL 8080 → 8090 |
| `frontend/src/utils/constants.ts` | API_BASE_URL 8080 → 8090 |
| `frontend/.env` | VITE_API_BASE_URL=http://localhost:8090 |
| `~/signoz/deploy/docker/otel-collector-config.yaml` | Ajout scrape job `gestionnaire` |

### Fichiers créés

| Fichier | Rôle |
|---------|------|
| `backend/gestionnaire/src/main/java/org/acme/entity/AuthEvent.java` | Entité JPA — 24 champs pour les events auth |
| `backend/gestionnaire/src/main/resources/db/migration/V4__create_auth_events.sql` | Table `auth_events` + index PostgreSQL |
| `backend/gestionnaire/src/main/resources/db/migration/V5__add_auth_events_sequence.sql` | Séquence Hibernate `auth_events_SEQ` |
| `backend/gestionnaire/src/main/java/org/acme/logging/AuthRequestContext.java` | Bean `@RequestScoped` — IP, UA, requestId, startTime |
| `backend/gestionnaire/src/main/java/org/acme/logging/AuthRequestFilter.java` | JAX-RS filter — capture métadonnées HTTP via Vert.x |
| `backend/gestionnaire/src/main/java/org/acme/metrics/AppMetrics.java` | Registry Micrometer — compteurs, timers, gauge sessions actives |

---

## Commandes utiles

```bash
# Voir les métriques Prometheus brutes
curl http://localhost:8090/q/metrics

# Voir les métriques auth uniquement
curl -s http://localhost:8090/q/metrics | grep "^auth"

# Consulter les events dans PostgreSQL
docker exec -it <postgres_container> psql -U admin -d gestionnaire_db -c \
  "SELECT event_type, status, username, ip_address, browser, response_time_ms FROM auth_events ORDER BY event_timestamp DESC LIMIT 10;"

# Redémarrer le collector SigNoz après modification du yaml
cd ~/signoz/deploy/docker && docker-compose restart otel-collector

# Voir les logs du collector
docker logs signoz-otel-collector --tail 50 -f

# Arrêter SigNoz
cd ~/signoz/deploy/docker && docker-compose down

# Arrêter l'infrastructure CrediWise
cd ~/CrediWise && docker-compose down
```


Résumé — Observabilité client + nouvelle_demande
Fichiers créés/modifiés
Microservice client (port 8082) :

Fichier	Rôle
pom.xml	+ quarkus-opentelemetry, micrometer, prometheus
application.properties	OTel + Micrometer + exclusion SQL Hibernate
ClientRequestContext.java	Bean @RequestScoped — IP, UA, timing
ClientRequestFilter.java	JAX-RS filter — capture IP réelle via Vert.x
ClientMetrics.java	Compteurs create/update/delete/search/grpc + latence
ClientEventService.java	MDC structuré → SigNoz Logs + Prometheus
ClientService.java	Instrumenté : create, update, delete + gRPC calls
V2__create_client_events.sql	Table client_events + index + séquence Hibernate
Microservice nouvelle_demande (port 8083) :

Fichier	Rôle
pom.xml	+ quarkus-opentelemetry, micrometer, prometheus
application.properties	OTel + Micrometer + exclusion SQL Hibernate
DemandeRequestContext.java	Bean @RequestScoped
DemandeRequestFilter.java	Capture IP réelle via Vert.x
DemandeMetrics.java	Métriques workflow + DistributionSummary montants crédits
DemandeEventService.java	MDC structuré → SigNoz Logs + Prometheus
DemandeService.java	Instrumenté : create, submit, updateStatut, update, delete
V2__create_demande_events.sql	Table demande_events + index + séquence
SigNoz :

Fichier	Modification
otel-collector-config.yaml	+ scrape jobs client:8082 et nouvelle_demande:8083





git clone https://github.com/SigNoz/signoz.git
cd signoz/deploy/docker
docker-compose up -d```