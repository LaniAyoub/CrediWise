Review code changes in the current branch for CrediWise.

Steps:
1. git diff main --stat
2. git diff main -- '*.java' '*.ts' '*.tsx' '*.proto' '*.sql'
3. For Java changes: check Quarkus patterns, Panache usage, REST endpoint conventions
4. For SQL changes: CRITICAL — verify it is a NEW migration file (V{n}__), never an edit to existing
5. For proto changes: check if gestionnaire.proto was changed — if yes, flag that backend/client/src/main/proto/gestionnaire.proto must also be updated
6. For TypeScript: cd frontend && npx tsc --noEmit
7. For frontend: cd frontend && npm run lint
8. Security check: grep for hardcoded passwords, secrets, tokens in changed files
9. Check: no localhost used inside Docker-networked code
10. Report findings: CRITICAL / WARNING / INFO with file:line
