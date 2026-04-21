# Docker dev environment for CrediWise

Current status: !`docker-compose ps 2>/dev/null || echo "Docker Compose not running"`

Services in docker-compose.yml:
  gestionnaire_db  → PostgreSQL 15, port 5432, DB: gestionnaire_db, user: admin
  client_db        → PostgreSQL 15, port 5433, DB: client_db,        user: admin
  nouvelle_demande_db → PostgreSQL 15, port 5434, DB: nouvelle_demande_db, user: admin
  analyse_db       → PostgreSQL 15, port 5435, DB: analyse_db,       user: admin
  pgadmin          → pgAdmin 4, port 8081 (admin@admin.com / admin)

Commands:
  Start DBs:        docker-compose up -d
  Stop DBs:         docker-compose stop
  Destroy + clean:  docker-compose down -v  ← WARNING: deletes all data
  DB logs:          docker-compose logs -f gestionnaire_db
  Connect to DB:    docker-compose exec gestionnaire_db psql -U admin -d gestionnaire_db
  pgAdmin:          http://localhost:8081

Frontend NOT containerized yet. Run with: cd frontend && npm run dev

Note: infrastructure/ directory is empty — production k8s/helm setup not yet created.
If asked to create production infra, scaffold it in infrastructure/ using Helm charts.
