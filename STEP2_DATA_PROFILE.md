# STEP 2 "OBJET DU CRÉDIT" — COMPREHENSIVE DATA PROFILE

**Date**: 2026-04-21  
**Purpose**: Phase A data gathering for Step 2 implementation  
**Status**: ✅ COMPLETE

---

## 📊 DEMANDE ENTITY FIELDS (ALL FIELDS WITH MAPPING)

### Physical Person Snapshot
| Java Field | DB Column | Type | Step 2 Section A? | Notes |
|------------|-----------|------|-------------------|-------|
| firstName | first_name | String | ❌ No | Step 1 only |
| lastName | last_name | String | ❌ No | Step 1 only |
| dateOfBirth | date_of_birth | LocalDate | ❌ No | Step 1 only |
| nationalId | national_id | String(50) | ❌ No | Step 1 only |
| gender | gender | String(10) | ❌ No | Step 1 only |
| maritalStatus | marital_status | String(20) | ❌ No | Step 1 only |
| nationality | nationality | String(100) | ❌ No | Step 1 only |
| monthlyIncome | monthly_income | BigDecimal(15,3) | ❌ No | Step 1 only |

### Legal Entity Snapshot
| Java Field | DB Column | Type | Step 2 Section A? | Notes |
|------------|-----------|------|-------------------|-------|
| companyName | company_name | String(200) | ❌ No | Step 1 only |
| sigle | sigle | String(50) | ❌ No | Step 1 only |
| registrationNumber | registration_number | String(100) | ❌ No | Step 1 only |
| principalInterlocutor | principal_interlocutor | String(200) | ❌ No | Step 1 only |

### Common Snapshot
| Java Field | DB Column | Type | Step 2 Section A? | Notes |
|------------|-----------|------|-------------------|-------|
| scoring | scoring | String(50) | ❌ No | Step 1 |
| managerName | manager_name | String(200) | ❌ No | Step 1 |
| branchId | branch_id | String(20) | ❌ No | Step 1 |
| branchName | branch_name | String(200) | ❌ No | Step 1 |
| cycle | cycle | String(50) | ❌ No | Step 1 |
| segment | segment | String(100) | ❌ No | Step 1 |
| accountType | account_type | String(100) | ❌ No | Step 1 |
| businessSector | business_sector | String(200) | ❌ No | Step 1 |
| businessActivity | business_activity | String(200) | ❌ No | Step 1 |
| email | email | String(150) | ❌ No | Step 1 |
| primaryPhone | primary_phone | String(30) | ❌ No | Step 1 |

### 🟢 CREDIT REQUEST — SECTION A FOR STEP 2
| Java Field | DB Column | Type | Step 2 Section A? | English Label | French Label |
|------------|-----------|------|-------------------|---------------|--------------|
| **loanPurpose** | loan_purpose | String(2000) | ✅ **YES** | "Credit Object / Purpose" | "Objet du Crédit" |
| **requestedAmount** | requested_amount | BigDecimal(15,3) | ✅ **YES** | "Requested Amount" | "Montant Demandé" |
| **durationMonths** | duration_months | Integer | ✅ **YES** | "Duration (months)" | "Durée (mois)" |
| **productId** | product_id | String(50) | ✅ **YES** | "Product ID" | "ID Produit" |
| **productName** | product_name | String(200) | ✅ **YES** | "Product Name" | "Nom du Produit" |
| **assetType** | asset_type | String(200) | ❌ Inventory | "Asset Type" | "Type d'Actif" |
| **monthlyRepaymentCapacity** | monthly_repayment_capacity | BigDecimal(15,3) | ✅ **YES** | "Monthly Repayment Capacity" | "Capacité de Remboursement Mensuel" |
| **applicationChannel** | application_channel | String(100) | ❌ Metadata | "Application Channel" | "Canal d'Application" |

### Risk Assessment (Not in Step 2 Section A)
| Java Field | DB Column | Type | Step 2 Section A? | Notes |
|------------|-----------|------|-------------------|-------|
| bankingRestriction | banking_restriction | Boolean | ❌ No | Risk section (Step 3?) |
| legalIssueOrAccountBlocked | legal_issue_or_account_blocked | Boolean | ❌ No | Risk section (Step 3?) |

### Consent & Signatories (Not in Step 2)
| Java Field | DB Column | Type | Step 2 Section A? | Notes |
|------------|-----------|------|-------------------|-------|
| consentText | consent_text | String(4000) | ❌ No | Sign-off section |
| signatories | signatories | String(500) | ❌ No | Sign-off section |

### References & IDs
| Java Field | DB Column | Type | Step 2 Section A? | Notes |
|------------|-----------|------|-------------------|-------|
| clientId | client_id | UUID | ❌ No | System reference |
| clientType | client_type | String(10) | ❌ No | System reference |
| status | status | DemandeStatut | ❌ No | System reference |
| requestDate | request_date | LocalDateTime | ❌ No | System reference |

### Audit Fields (Not in Step 2)
| Java Field | DB Column | Type | Step 2 Section A? | Notes |
|------------|-----------|------|-------------------|-------|
| createdAt | created_at | LocalDateTime | ❌ No | Audit |
| updatedAt | updated_at | LocalDateTime | ❌ No | Audit |
| createdBy | created_by | UUID | ❌ No | Audit |
| updatedBy | updated_by | UUID | ❌ No | Audit |
| deletedBy | deleted_by | UUID | ❌ No | Audit |
| deletedAt | deleted_at | LocalDateTime | ❌ No | Audit |

### Relations (Not in Section A)
| Java Field | Type | Step 2 Section A? | Notes |
|------------|------|-------------------|-------|
| guarantors | List<Guarantor> | ❌ No | Step 6: Guarantee |
| guarantees | List<Guarantee> | ❌ No | Step 6: Guarantee |

---

## 🔗 SECTION A FIELD MAPPING (Step 2 Display)

```
SECTION A: OBJET DU CRÉDIT (Credit Object)
─────────────────────────────────────────

1. Objet du Crédit (Credit Purpose)
   ← demande.loanPurpose (String, 2000 chars)
   ✅ AVAILABLE in Demande entity
   Type: Long text (textarea)

2. Montant Demandé (Requested Amount)
   ← demande.requestedAmount (BigDecimal)
   ✅ AVAILABLE in Demande entity
   Type: Currency input
   Display: Formatted currency (e.g., 50,000.00 TND)

3. Durée (mois) (Duration in months)
   ← demande.durationMonths (Integer)
   ✅ AVAILABLE in Demande entity
   Type: Number input
   Display: 12 months, 24 months, etc.

4. Produit (Product)
   ← demande.productId + demande.productName (String)
   ✅ AVAILABLE in Demande entity
   Type: Display as "[productId] - productName" OR just productName
   Note: productId = reference code (e.g., "PROD-001")
         productName = user-friendly name

5. Capacité de Remboursement Mensuel (Monthly Repayment Capacity)
   ← demande.monthlyRepaymentCapacity (BigDecimal)
   ✅ AVAILABLE in Demande entity
   Type: Currency display
   Note: Calculated or entered during demande creation
         Used for affordability analysis
```

---

## 📡 gRPC FOR DEMANDE FETCH

### Current Status
✅ **DemandeService.getById() EXISTS as REST endpoint**
- Location: `backend/nouvelle_demande/src/main/java/org/acme/resource/DemandeResource.java`
- Endpoint: `GET /api/demandes/{id}`
- Response: `DemandeResponse` DTO (contains ALL demande fields)
- Security: @RolesAllowed({"SUPER_ADMIN", "CRO", ...})
- Returns: 200 with full demande object, 404 if not found

### No gRPC Proto Exposed
❌ **nouvelle_demande does NOT expose gRPC service**
- Current: REST API only
- gRPC possible but not implemented
- For Step 2, use existing REST endpoint via DemandeService

### Recommended Fetch Strategy for Step 2
```
Frontend (analyseService):
  1. Already have demandeId from AnalyseDossier
  2. Option A: Fetch via demande REST API directly (separate call)
  3. Option B: Extend StepCreditResponse to include Section A fields
  4. Option C: Create new StepCreditResponse record mirroring Section A structure
  
Recommended: Option B or C (extend/create new response DTO)
Reason: Keeps all step data in one response, consistent with Step 1 pattern
```

---

## 📁 EXISTING ANALYSE SERVICE STATE

### Migration Files
```
✅ backend/analyse/src/main/resources/db/migration/
   V1__init_schema.sql                    — Initial schema
   V2__add_location_field.sql             — Added location field  
   V3__add_resolved_label_names.sql       — Added reference label columns
   V4__add_manager_info_columns.sql       — Added manager info columns
   V5__update_status_constraint.sql       — Updated status to 10 values
```

### Entities
```
✅ AnalyseDossier
   - id (Long, auto-increment)
   - demandeId (Long, FK to nouvelle_demande.demandes)
   - clientId (UUID)
   - gestionnaireId (UUID)
   - status (DossierStatus enum: DRAFT, SUBMITTED, ANALYSE, etc.)
   - currentStep (Integer: 1-7)
   - demandeCreatedAt (LocalDateTime)
   - createdAt, updatedAt (timestamps)
   - completedAt (nullable)

✅ StepClient (entity for Step 1 confirmation state)
   Fields: (mirrors StepClientResponse)

❌ StepCredit (NOT YET CREATED for Step 2)
   Needs to be created
```

### REST Endpoints Already Built
```
✅ POST   /analyses/dossiers                    — Create dossier
✅ GET    /analyses/dossiers                    — List all dossiers
✅ GET    /analyses/dossiers/{dossierId}        — Get dossier details
✅ GET    /analyses/dossiers/{dossierId}/steps/1  — Get Step 1 confirmed data
✅ POST   /analyses/dossiers/{dossierId}/steps/1/confirmer — Confirm Step 1
✅ GET    /analyses/dossiers/{dossierId}/steps/1/preview   — Preview Step 1

❌ GET    /analyses/dossiers/{dossierId}/steps/2  — Need for Step 2
❌ POST   /analyses/dossiers/{dossierId}/steps/2/confirmer — Need for Step 2
```

### Step 1 Pattern (Reference for Step 2)
```
Step 1 Flow:
  1. User views dossier → DossierAnalysePage calls analyseService.getStep1()
  2. Fetches StepClientData from backend
  3. Renders StepClientView component (read-only display)
  4. User clicks "Confirm" button → calls analyseService.confirmerStep1()
  5. Backend updates StepClient entity, returns updated StepClientData
  6. Frontend updates UI, currentStep advances to 2

Step 2 Should Mirror This Pattern:
  1. Fetch StepCreditData from /analyses/dossiers/{id}/steps/2
  2. Render StepCreditView component
  3. Confirm via /analyses/dossiers/{id}/steps/2/confirmer
  4. Auto-advance to Step 3
```

---

## 🎨 FRONTEND PATTERNS FOUND

### StepClientView Component Structure
```
Layout:
  <div className="space-y-6">
    {/* Header with title + dossier status badge */}
    <h1>{t('analyse:step1.title')}</h1>
    <Badge>{dossierStatus}</Badge>

    {/* Section: General Information (3 cards) */}
    <div className="grid grid-cols-3 gap-4">
      <Card>Agence Libellé</Card>
      <Card>Manager Name</Card>
      <Card>Request Date</Card>
    </div>

    {/* Section: Client Information (multi-card layout) */}
    <Card>
      <h3>Client Information</h3>
      {/* 2-column field layout */}
      <div className="grid grid-cols-2 gap-4">
        <Field>firstName</Field>
        <Field>lastName</Field>
        ...
      </div>
    </Card>

    {/* Section: Company Information (conditional - LEGAL only) */}
    {clientType === 'LEGAL' && (
      <Card>
        <h3>Company Information</h3>
        ...
      </Card>
    )}

    {/* Section: Credit History (table) */}
    <Card>
      <h3>Credit History</h3>
      <table>
        <thead><tr><th>Demande #</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>...</tbody>
      </table>
    </Card>

    {/* Footer: Buttons */}
    <div className="flex gap-3">
      <Button variant="outline">Back to Dossier List</Button>
      <Button variant="primary" onClick={onConfirmer} disabled={isConfirming}>
        {isConfirming ? t('...confirming...') : t('...confirm...')}
      </Button>
    </div>
  </div>
```

**Styling**: TailwindCSS (no CSS modules)  
**Typography**: Heading/Label/Body semantic classes  
**Colors**: Status badges use getStatusColor() from statusMapping utility  
**Dark mode**: Supported via class-based toggle

### DossierAnalysePage Behavior
```
Load flow:
  1. useEffect(() => {
       analyseService.getDossier(dossierId)
       analyseService.getStep1(dossierId) [or .previewStep1()]
     }, [dossierId])
  
  2. If getStep1() fails, fallback to previewStep1()
  
  3. Render StepIndicator + StepClientView
  
  4. StepClientView emits onConfirmer callback
  
  5. DossierAnalysePage calls analyseService.confirmerStep1()
  
  6. On success:
     - Update local state with new dossier + step data
     - Show toast success message
     - dossier.currentStep = 2 (advances automatically)
```

### analyseService Methods (Existing)
```typescript
✅ getDossierList()           — GET /analyses/dossiers
✅ getDossier(dossierId)      — GET /analyses/dossiers/{id}
✅ creerDossier(...)          — POST /analyses/dossiers (legacy)
✅ getStep1(dossierId)        — GET /analyses/dossiers/{id}/steps/1
✅ previewStep1(dossierId)    — GET /analyses/dossiers/{id}/steps/1/preview
✅ confirmerStep1(dossierId)  — POST /analyses/dossiers/{id}/steps/1/confirmer

❌ getStep2(dossierId)        — NEEDS TO BE ADDED
❌ previewStep2(dossierId)    — NEEDS TO BE ADDED
❌ confirmerStep2(dossierId)  — NEEDS TO BE ADDED
```

### i18n Keys Already Defined (analyse.json)
```
✅ analyse:step (generic step label)
✅ analyse:steps.* (all 7 step names including "objetCredit")
✅ analyse:step1.* (all Step 1 specific keys)
✅ analyse:dossier.* (dossier status labels)
✅ analyse:common.* (generic analysis labels)

❌ analyse:step2.* (NOT YET — needs to be added)
   Required keys:
   - step2.title
   - step2.creditInfo
   - step2.objetDuCredit
   - step2.confirmer
   - step2.confirming
   - step2.confirmed
   - step2.confirmedSuccess
```

---

## 🚨 GAPS & MISSING PIECES

### Backend Gaps
| Item | Status | Required? | Notes |
|------|--------|-----------|-------|
| StepCredit entity | ❌ MISSING | ✅ YES | Store Section A confirmation state |
| StepCreditResponse DTO | ❌ MISSING | ✅ YES | API response for Step 2 |
| StepCreditService | ❌ MISSING | ✅ YES | Business logic for Step 2 |
| Step 2 REST endpoints | ❌ MISSING | ✅ YES | GET /steps/2, POST /steps/2/confirmer |
| Step 2 i18n keys | ❌ MISSING | ✅ YES | Add to analyse.json |
| Step 2 database migration | ⚠️ OPTIONAL | ❓ Maybe | Only if StepCredit needs separate table |

### Frontend Gaps
| Item | Status | Required? | Notes |
|------|--------|-----------|-------|
| StepCreditView component | ❌ MISSING | ✅ YES | Display Section A data |
| Step 2 types | ❌ MISSING | ✅ YES | StepCreditData interface |
| analyseService methods | ❌ MISSING | ✅ YES | getStep2, confirmerStep2, previewStep2 |
| Step 2 styling | ❌ MISSING | ✅ YES | Card layout, form styles |

### Architecture Decisions Needed
| Decision | Current | Needed | |
|----------|---------|--------|---|
| StepCredit table | ❓ | Need to decide | Create separate table or store in AnalyseDossier? |
| Response structure | StepClientResponse | StepCreditResponse | Same pattern? |
| Demande fetch | REST API | ✅ Already available | Use DemandeService or extend StepCredit? |
| Confirmation logic | Persists to StepClient | ✅ Persist to StepCredit? | Auto-advance to Step 3? |

---

## 📋 SUMMARY TABLE

| Aspect | Status | Details |
|--------|--------|---------|
| **Source Data Available** | ✅ YES | Demande entity has all 5 Section A fields |
| **API to Fetch Demande** | ✅ YES | REST endpoint exists: GET /api/demandes/{id} |
| **gRPC Alternative** | ❌ NO | nouvelle_demande doesn't expose gRPC |
| **Step 1 Pattern** | ✅ YES | Clear pattern: fetch → render → confirm → advance |
| **Backend Structure** | ⚠️ PARTIAL | Entities exist, but Step 2 endpoints missing |
| **Frontend Components** | ⚠️ PARTIAL | Step 1 exists, Step 2 component missing |
| **i18n Keys** | ⚠️ PARTIAL | analyse:step1.* ready, analyse:step2.* missing |
| **Database Schema** | ✅ YES | Migrations up to V5, ready for Step 2 table |
| **Ready to Build?** | ✅ YES | All dependencies in place, ready for Phase B |

---

## 🎯 RECOMMENDATIONS FOR PHASE B

### Backend Implementation Order
1. Create StepCredit entity (mirrors StepClient pattern)
2. Create StepCreditResponse DTO with Section A fields
3. Create StepCreditService (business logic)
4. Add REST endpoints to AnalyseDossierResource
5. Database migration (if needed)

### Frontend Implementation Order
1. Add StepCreditData type to analyse.ts
2. Add analyseService methods (getStep2, confirmerStep2, previewStep2)
3. Create StepCreditView component (copy Step1 pattern)
4. Add i18n keys to analyse.json (both en and fr)
5. Update DossierAnalysePage to load Step 2

### Data Flow (Proposed)
```
User clicks Step 2
  ↓
analyseService.getStep2(dossierId)
  ↓
GET /analyses/dossiers/{id}/steps/2
  ↓
Backend fetches from StepCredit table OR on-demand from Demande
  ↓
Returns StepCreditData (loanPurpose, requestedAmount, durationMonths, productId, monthlyRepaymentCapacity)
  ↓
StepCreditView renders Section A fields
  ↓
User clicks "Confirm"
  ↓
analyseService.confirmerStep2(dossierId)
  ↓
POST /analyses/dossiers/{id}/steps/2/confirmer
  ↓
Backend persists confirmation to StepCredit
  ↓
Frontend advances to Step 3
```

---

**END OF PHASE A DATA PROFILE**  
**Status**: ✅ READY FOR PHASE B IMPLEMENTATION

