# Java / Quarkus rules for CrediWise

Architecture:
- Framework: Quarkus 3.34.1 (do not upgrade without testing all 4 services)
- Java: 21 (use records, sealed classes, pattern matching where appropriate)
- ORM: Hibernate ORM Panache — use active record pattern (Entity.find(), Entity.persist())
- Do not introduce JPA repositories or Spring-style @Repository — use Panache only
- Do not mix REST clients and gRPC in the same service call chain without reason

REST conventions:
- Resource classes annotated with @Path, @Produces(MediaType.APPLICATION_JSON)
- All endpoints must have @RolesAllowed — NEVER leave an endpoint without auth
- Use @Valid on all @RequestBody parameters
- Return Response objects or typed POJOs (not Maps)
- Use SmallRye OpenAPI: @Operation, @APIResponse on every endpoint
- Error responses: use proper HTTP status codes (400, 401, 403, 404, 409, 500)

gRPC conventions:
- Service implementations annotated with @GrpcService
- gRPC clients injected with @GrpcClient
- Always handle gRPC StatusRuntimeException in callers
- Proto naming: camelCase for fields, PascalCase for messages and services

Database / Flyway:
- NEVER edit existing migration files
- New migration = new file with next version number
- Migration naming: V{n}__{short_lowercase_description}.sql
- Always use IF NOT EXISTS on CREATE TABLE
- Index foreign key columns

Security:
- JWT: RS256 algorithm, keys in backend/gestionnaire/
- @RolesAllowed({"FRONT_OFFICE"}) or @RolesAllowed({"SUPER_ADMIN"})
- privateKey.pem and publicKey.pem must NOT be committed to git

Code style:
- Package: org.acme.{service-specific}
- No System.out.println — use @Inject Logger or io.quarkus.logging.Log
- Use @ApplicationScoped or @RequestScoped beans (not @Singleton for stateful)
- Validate all inputs with @NotNull, @NotBlank, @Size at DTO level
