# Security review for CrediWise

When invoked, check in this order:

CRITICAL:
- JWT keys not in .gitignore: check if privateKey.pem/publicKey.pem are tracked by git
  Command: git ls-files backend/gestionnaire/*.pem
  If output is non-empty → CRITICAL: add to .gitignore immediately
- Hardcoded credentials: grep -r "password\|secret\|admin" --include="*.java" --include="*.properties" backend/ | grep -v "test\|//\|#"
- Unauthenticated endpoints: grep -r "@Path" --include="*.java" -l backend/ | xargs grep -L "@RolesAllowed"
- SQL injection in JPQL: grep -r "\".*+.*\"\|query.*concat" --include="*.java" backend/

HIGH:
- CORS misconfiguration: grep -r "quarkus.http.cors" --include="*.properties" backend/
- gRPC calls without deadline: grep -r "GrpcClient\|grpcClient" --include="*.java" backend/ | grep -v "withDeadlineAfter"
- Missing @Valid on REST endpoints: grep -r "@POST\|@PUT" --include="*.java" -A5 backend/ | grep -v "@Valid"

MEDIUM:
- DB credentials in properties: grep -r "quarkus.datasource.password" --include="*.properties" backend/ | grep -v "%prod"
- Frontend API URL hardcoded: grep -r "localhost:808" --include="*.ts" --include="*.tsx" frontend/src/
- Missing error handling in Axios calls: grep -r "axios\." --include="*.ts" frontend/src/services/ | grep -v "catch\|try"

Report format: SEVERITY | file:line | issue | fix
