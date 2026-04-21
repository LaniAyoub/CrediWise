# analyse service
Credit analysis service. Manages 7-step analysis dossier workflow for credit requests.

Start: cd backend/analyse && mvn quarkus:dev
Test:  cd backend/analyse && mvn test
Swagger: http://localhost:8084/q/swagger-ui

## Status (2026-04-21)
✅ Step 1 (Client) — COMPLETE: Full client snapshot, credit history, manager info
✅ Step 2 (Credit Object) — COMPLETE: Section A snapshot, expenses (B), other financing (C), balance calculation
⏳ Steps 3-7 — TODO

## Key files
- src/main/resources/application.properties → HTTP 8084, gRPC 9003
- src/main/resources/db/migration/V6__add_step_objet_credit.sql → Step 2 tables
- src/main/java/org/acme/entity/StepObjetCredit.java → Step 2 main entity
- src/main/java/org/acme/entity/StepDépenseProjet.java → Step 2 expenses
- src/main/java/org/acme/entity/StepFinancementAutre.java → Step 2 other financing
- src/main/java/org/acme/service/StepCreditService.java → Step 2 business logic
- src/main/proto/nouvelle_demande.proto → gRPC client definition (MUST sync with nouvelle_demande service)

## gRPC
- Port: 9003
- Services:
  - **HistoriqueService** (existing) — fetch credit history from nouvelle_demande
  - **NouvelleDemandeService** (new) — fetch demande details for Step 2 Section A

## Important Notes
- Step 2 balance calculation is **warning-only**, never blocks operations
- Balance: `isBalanced = |totalExpenses - (requestedAmount + totalOther)| ≤ 0.01`
- Cascade replace on save: delete all expenses/financing, recreate from request (automatic reordering)
- nouvelle_demande.proto is DUPLICATED in analyse/src/main/proto/ — MUST update both files together
