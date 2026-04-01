# AGENTS.md: Gestionner Backend AI Agent Guide

## Project Overview

**gestionner_backend** is a Quarkus 3.32.4 REST microservice managing financial entities with PostgreSQL persistence. Built with Java 21, Maven, and Hibernate ORM with Panache, it follows the Jakarta REST/JPA standards.

- **Framework**: Quarkus (supersonic, subatomic Java)
- **Language**: Java 21
- **Build Tool**: Maven (use `mvnw` on Windows, `./mvnw` on Unix)
- **Key Dependencies**: Hibernate ORM Panache, Quarkus REST, Jackson, PostgreSQL JDBC, Flyway

## Architecture & Patterns

### REST Resource Pattern (Simple)
`ExampleResource.java` shows basic REST endpoints:
- Use `@Path("/resource-name")` class annotation
- Decorate methods with `@GET`, `@POST`, etc.
- Return `MediaType.TEXT_PLAIN`, `MediaType.APPLICATION_JSON`

### Entity & REST Data Pattern (Recommended)
`MyEntity.java` + `MyEntityResource.java` demonstrate the preferred pattern:
- Extend `PanacheEntity` for active-record ORM (auto-generates `id`)
- Extend `PanacheEntityResource<MyEntity, Long>` to auto-generate CRUD REST endpoints
- **No @Path or method annotations needed** - Quarkus generates them from generic type
- Database CRUD is available at `/my-entities` (kebab-case pluralization)

### Panache Basics
- **Active Record**: Entity methods like `.persist()`, `.list()`, `.find()`, `.delete()`
- For repository pattern, implement `PanacheRepository<MyEntity>` instead
- Query example: `MyEntity.find("field = ?1", value).firstResult()`

## Development Workflow

### Local Development (Dev Mode)
```bash
./mvnw quarkus:dev
```
- **Enables**: Live coding (hot reload), Dev UI at `http://localhost:8080/q/dev/`
- **Database**: Must have PostgreSQL running on `localhost:5432` (see `application.properties`)
- **Log SQL**: Set to `true` in properties (useful for debugging ORM queries)

### Build & Package
```bash
./mvnw package                          # Creates quarkus-run.jar (thin JAR + lib/)
./mvnw package -Dquarkus.package.jar.type=uber-jar  # Creates fat JAR
./mvnw package -Dnative                 # Native executable (requires GraalVM)
./mvnw package -Dnative -Dquarkus.native.container-build=true  # Native in Docker
```

### Testing
- **Unit/Integration Tests**: `src/test/java/**/*Test.java` run with `maven-surefire-plugin`
- **Integration Tests**: `src/test/java/**/*IT.java` run with `maven-failsafe-plugin`
- **Test Framework**: JUnit Jupiter (JUnit 5) + REST Assured for REST testing
- **Quarkus Test**: Use `@QuarkusTest` annotation; automatically starts/stops test server

Example from `ExampleResourceTest.java`:
```java
@QuarkusTest
class ExampleResourceTest {
    @Test
    void testHelloEndpoint() {
        given().when().get("/hello").then().statusCode(200);
    }
}
```

## Critical Configuration

### Database
```ini
quarkus.datasource.db-kind=postgresql
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/gestionnaire_db
quarkus.datasource.username=admin
quarkus.datasource.password=admin
```
Located in `src/main/resources/application.properties`

### Schema Migration
- **Hibernate ORM**: `schema-management.strategy=update` (auto-updates on startup)
- **Flyway**: `migrate-at-start=true` (optional, for SQL migrations in `src/main/resources/db/migration/`)

## File Structure & Key Locations

- `src/main/java/org/acme/` - Java source code (resources, entities, services)
- `src/main/resources/` - Configuration & DB migrations
- `src/test/java/org/acme/` - Tests (JUnit + REST Assured)
- `src/main/docker/` - Dockerfiles (JVM, native, micro variants)
- `target/` - Build artifacts (ignore in edits)

## Important Conventions

1. **Package**: All classes in `org.acme.*` namespace
2. **Resource Naming**: REST resource class names → endpoint path via `@Path("/resource")` or auto-pluralization
3. **HTTP Methods**: `@GET`, `@POST`, `@PUT`, `@DELETE` (use on methods)
4. **Response Types**: Default to JSON; return POJOs, Collections, or Response objects
5. **Panache Entities**: Extend `PanacheEntity`, no need to define `id` field
6. **Test Naming**: `*Test` for unit tests, `*IT` for integration tests

## Common Development Tasks

### Add New Entity & REST Endpoints
1. Create class extending `PanacheEntity` with fields in `src/main/java/org/acme/`
2. Create interface extending `PanacheEntityResource<YourEntity, Long>` (no implementation needed)
3. Run `./mvnw quarkus:dev` - endpoints auto-available at `/your-entities`

### Add Custom Query Method
Add static methods to entity class:
```java
public static MyEntity findByField(String fieldValue) {
    return find("field = ?1", fieldValue).firstResult();
}
```

### Run Tests
```bash
./mvnw test                 # Unit tests only
./mvnw verify               # All tests + integration
./mvnw test -Dtest=ExampleResourceTest  # Single test class
```

### Check Logs During Dev
Dev mode logs to console. SQL queries logged if `quarkus.hibernate-orm.log.sql=true`. Check `target/` for detailed logs.

## Dependencies & Integrations

- **Quarkus REST** (replacing RESTEasy) - Jakarta REST implementation
- **Jackson** - JSON serialization (auto-configured via `quarkus-rest-jackson`)
- **Hibernate ORM + Panache** - ORM + active-record pattern
- **Flyway** - SQL-based schema versioning
- **PostgreSQL JDBC** - Database driver
- **ARC** - CDI/dependency injection
- **REST Assured** - HTTP assertions in tests

No external message queues, caching layers, or auth frameworks currently in use.

## Troubleshooting for AI Agents

| Issue | Solution |
|-------|----------|
| `PanacheEntity.listAll()` returns empty | Verify DB is running, check Hibernate dialect, confirm schema exists |
| Hot reload not working in dev mode | Restart `./mvnw quarkus:dev`; check IDE compiler settings |
| Test fails with `@QuarkusTest` | Ensure test DB matches config; check `src/test/resources/application.properties` |
| Native build fails | GraalVM required; use `container-build=true` for Docker-based native build |
| Port 8080 in use | Set `quarkus.http.port=8081` in `application.properties` or CLI |

