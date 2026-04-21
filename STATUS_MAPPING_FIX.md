# Status Mapping Fix: Unified Credit Request Status Handling

## Overview

This fix addresses inconsistencies in how request statuses are handled across the backend, frontend, and database. The solution establishes a single source of truth (backend enum) with a frontend mapping layer to ensure consistent status display throughout the application.

## Problem

Before this fix, the system had several inconsistencies:

1. **Inconsistent Translation Keys**: Different components used different key patterns
   - DemandesPage used: `status.draft`, `status.submitted`, `status.validated`
   - DossierPages used: `dossier.status.{status.lowercase()}`
   - No translation keys existed in i18n files

2. **Raw Enum Values Displayed**: Status was displayed as raw enum values (DRAFT, SUBMITTED, ANALYSE) instead of user-friendly translations

3. **Hardcoded Status Logic**: Status-related logic was scattered across components with no unified mapping

4. **Type Inconsistencies**: Frontend didn't properly type status values

## Solution

### 1. Backend (No Changes Required)
- ✅ DemandeStatut enum remains unchanged
- ✅ Backend always returns raw enum values (DRAFT, SUBMITTED, ANALYSE, etc.)
- ✅ No translation or modification in backend APIs

### 2. Frontend: Created Status Mapping Utility

**File**: `frontend/src/utils/statusMapping.ts`

Provides:
- **STATUS_TO_I18N_KEY**: Strict mapping from enum values to translation keys
- **getStatusKey()**: Function to get i18n key for a status
- **getAllStatuses()**: Helper to get all available statuses
- **getStatusColor()**: Function to get color classes for status badges

```typescript
const STATUS_TO_I18N_KEY: Record<DemandeStatut | DossierStatus, string> = {
  DRAFT: "dossier.status.draft",
  SUBMITTED: "dossier.status.submitted",
  ANALYSE: "dossier.status.analyse",
  CHECK_BEFORE_COMMITTEE: "dossier.status.check_before_committee",
  CREDIT_RISK_ANALYSIS: "dossier.status.credit_risk_analysis",
  COMMITTEE: "dossier.status.committee",
  WAITING_CLIENT_APPROVAL: "dossier.status.waiting_client_approval",
  READY_TO_DISBURSE: "dossier.status.ready_to_disburse",
  DISBURSE: "dossier.status.disburse",
  REJECTED: "dossier.status.rejected",
};
```

### 3. Updated i18n Files

**Files**: 
- `frontend/src/locales/en/common.json`
- `frontend/src/locales/fr/common.json`

Added complete status translations under `dossier.status.*`:

**English**:
```json
{
  "dossier": {
    "allStatuses": "All Statuses",
    "status": {
      "draft": "Draft",
      "submitted": "Submitted",
      "analyse": "In Analysis",
      "check_before_committee": "Pre-Committee Check",
      "credit_risk_analysis": "Credit Risk Analysis",
      "committee": "Committee",
      "waiting_client_approval": "Waiting Client Approval",
      "ready_to_disburse": "Ready to Disburse",
      "disburse": "Disbursed",
      "rejected": "Rejected"
    }
  }
}
```

**French**:
```json
{
  "dossier": {
    "allStatuses": "Tous les Statuts",
    "status": {
      "draft": "Brouillon",
      "submitted": "Soumis",
      "analyse": "En Analyse",
      "check_before_committee": "Vérification Avant Comité",
      "credit_risk_analysis": "Analyse de Risque Crédit",
      "committee": "Comité",
      "waiting_client_approval": "En Attente d'Approbation Client",
      "ready_to_disburse": "Prêt à être Déboursé",
      "disburse": "Déboursé",
      "rejected": "Rejeté"
    }
  }
}
```

### 4. Updated Components

#### DossierAnalysePage.tsx
- Imported `getStatusKey` and `getStatusColor` from mapping utility
- Removed local `getStatusColor()` function
- Updated status display: `t(getStatusKey(dossier.status))`
- Updated color classes to use mapping: `${getStatusColor(dossier.status).text} ${getStatusColor(dossier.status).bg}`

#### DossierListPage.tsx
- Imported `getStatusKey` and `getStatusColor`
- Removed local `getStatusColor()` function
- Updated status display in table: `t(getStatusKey(dossier.status))`
- Updated color classes from mapping

#### DemandesPage.tsx
- Imported `getStatusKey` from mapping utility
- Updated status filter dropdown to use mapping:
  - Changed from: `t('statusOptions.draft')`, etc.
  - Changed to: `t(getStatusKey('DRAFT'))`, etc.
  - Changed "All Statuses" option to: `t('dossier.allStatuses')`
- Updated stats cards to use mapping:
  - Changed from: `t('status.draft')`, `t('status.submitted')`, `t('status.validated')`
  - Changed to: `t(getStatusKey('DRAFT'))`, `t(getStatusKey('SUBMITTED'))`, `t(getStatusKey('ANALYSE'))`
- Updated demande status badge in table:
  - Changed from: `{d.status}`
  - Changed to: `{t(getStatusKey(d.status))}`

#### DashboardPage.tsx
- Imported `getStatusKey` from mapping utility
- Updated demande status display in recent demandes section:
  - Changed from: `{d.status}`
  - Changed to: `{commonT(getStatusKey(d.status))}`

#### StepClientView.tsx
- Imported `getStatusKey` from mapping utility
- Updated dossier status display:
  - Changed from: `{data.dossierStatus || '—'}`
  - Changed to: `{data.dossierStatus ? t(getStatusKey(data.dossierStatus as any)) : '—'}`
- Updated credit history status display:
  - Changed from: `{item.status}`
  - Changed to: `{t(getStatusKey(item.status as any))}`

## Result

### Before
```
Database → DRAFT
API → DRAFT
Frontend logic → DRAFT  
UI → DRAFT  (raw enum displayed)
```

### After
```
Database → DRAFT
API → DRAFT
Frontend logic → DRAFT (via getStatusKey())
UI → "Draft" (translated via i18n)
```

## Usage Pattern

**Always use this pattern for displaying status:**

```typescript
import { getStatusKey, getStatusColor } from '@/utils/statusMapping';
import { useTranslation } from 'react-i18next';

// In component:
const { t } = useTranslation('common');

// Display translated status
<span>{t(getStatusKey(status))}</span>

// Get color styling
<span className={`${getStatusColor(status).bg} ${getStatusColor(status).text}`}>
  {t(getStatusKey(status))}
</span>
```

## Never Do This

❌ Display raw status: `{status}`  
❌ Hardcoded translation keys: `t('status.draft')`  
❌ String interpolation: `t(\`dossier.status.\${status.toLowerCase()}\`)`  
❌ Hardcoded colors: `'bg-blue-100 text-blue-700'`  

## Benefits

1. **Single Source of Truth**: Enum values → i18n keys mapping is centralized
2. **Type Safety**: TypeScript prevents invalid status values
3. **Consistency**: All status displays use the same mapping
4. **Maintainability**: Changing status labels requires only i18n file updates
5. **Localization**: Easy to add new language translations
6. **Testability**: Mapping logic can be tested independently

## Files Modified

1. ✅ `frontend/src/utils/statusMapping.ts` — NEW
2. ✅ `frontend/src/locales/en/common.json` — UPDATED
3. ✅ `frontend/src/locales/fr/common.json` — UPDATED
4. ✅ `frontend/src/pages/demandes/DemandesPage.tsx` — UPDATED
5. ✅ `frontend/src/pages/analyse/DossierAnalysePage.tsx` — UPDATED
6. ✅ `frontend/src/pages/analyse/DossierListPage.tsx` — UPDATED
7. ✅ `frontend/src/pages/dashboard/DashboardPage.tsx` — UPDATED
8. ✅ `frontend/src/components/analyse/steps/StepClientView.tsx` — UPDATED

## Build Status

✅ Frontend: Built successfully
✅ No TypeScript errors
✅ All imports properly typed
✅ All components use the mapping utility

## Testing Checklist

- [ ] Navigate to Demandes page — verify status displays as translated labels
- [ ] Filter by status — verify all 4 options are displayed with translations
- [ ] View demande list — verify status badges show translations
- [ ] View dossier page — verify status displays as translation
- [ ] Check dashboard — verify recent demandes show translated statuses
- [ ] Switch language to French — verify all statuses display in French
- [ ] Check colors — verify status badges show correct colors per mapping

## Future Enhancements

1. Consider extracting color mapping to CSS variables for consistency with design system
2. Add status-related utilities (e.g., `canTransitionFrom()`, `isValidTransition()`)
3. Create status badge component that uses mapping internally
4. Add analytics tracking for status changes
