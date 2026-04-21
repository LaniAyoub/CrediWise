# API conventions for CrediWise

REST (Quarkus SmallRye):
- Swagger UI: http://localhost:{port}/q/swagger-ui (each service has its own)
- Base path per service — no /api/v1 prefix (Quarkus default root)
- HTTP methods: GET (read), POST (create), PUT (full update), PATCH (partial), DELETE
- Auth header: Authorization: Bearer {jwt_token}
- CORS: gestionnaire only allows http://localhost:3000 — frontend talks ONLY to gestionnaire directly for auth; use gestionnaire as API gateway for cross-service calls if needed

Response conventions:
- Success: return the resource or list directly (no envelope wrapper currently in project)
- Errors: Quarkus default error format (do not change without updating frontend error handlers)
- Pagination: not yet implemented — when adding, use ?page=0&size=20 (Quarkus Panache convention)

Inter-service gRPC:
- client → gestionnaire: GestionnaireService.GetGestionnaireById, AgenceService.GetAgenceById
- All gRPC calls must have deadlines: .withDeadlineAfter(5, TimeUnit.SECONDS)
- Wrap gRPC calls in try/catch for StatusRuntimeException
- Log correlation info on every gRPC call

Frontend → Backend:
- All API calls in src/services/ (one file per backend service area)
- Token stored in context/localStorage — send in every authenticated request
- On 401: clear token, redirect to login
