# Quarkus skill for CrediWise

Quarkus version: 3.34.1
Java version: 21
Services and ports: !`find backend -name "application.properties" | xargs grep -h "quarkus.http.port" 2>/dev/null | sort`
Running services: !`curl -s http://localhost:8080/q/health/live 2>/dev/null && echo "gestionnaire UP" || echo "gestionnaire DOWN"`

Dev mode commands (run from service directory):
  cd backend/gestionnaire && mvn quarkus:dev
  cd backend/client && mvn quarkus:dev
  cd backend/nouvelle_demande && mvn quarkus:dev
  cd backend/analyse && mvn quarkus:dev

Useful Quarkus dev endpoints (replace port):
  /q/health        — health check
  /q/health/live   — liveness
  /q/health/ready  — readiness
  /q/metrics       — metrics
  /q/swagger-ui    — API explorer
  /q/dev-ui        — Quarkus dev console

Panache patterns used in this project:
  // Active record
  Gestionnaire.findById(id)
  Gestionnaire.find("email", email).firstResult()
  Gestionnaire.listAll()
  entity.persist()
  entity.delete()

Flyway migration status: !`find backend -name "V*.sql" -path "*/db/migration/*" | sort`

Common Quarkus errors:
- "Schema not found" → docker-compose DBs not running, or Flyway migration failed
- "JWT parse error" → privateKey.pem/publicKey.pem not in place or wrong path in application.properties
- "gRPC channel failed" → target service not running on expected gRPC port
- "Application startup failed" → check quarkus:dev console, usually DB connection or missing config
