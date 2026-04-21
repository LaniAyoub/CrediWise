# Status Mapping Quick Reference

## What Changed?

Status values now display as user-friendly translated labels instead of raw enum values throughout the entire application.

### Visual Examples

| Database | API | Display (EN) | Display (FR) |
|----------|-----|--------------|--------------|
| DRAFT | DRAFT | Draft | Brouillon |
| SUBMITTED | SUBMITTED | Submitted | Soumis |
| ANALYSE | ANALYSE | In Analysis | En Analyse |
| CHECK_BEFORE_COMMITTEE | CHECK_BEFORE_COMMITTEE | Pre-Committee Check | Vérification Avant Comité |
| CREDIT_RISK_ANALYSIS | CREDIT_RISK_ANALYSIS | Credit Risk Analysis | Analyse de Risque Crédit |
| COMMITTEE | COMMITTEE | Committee | Comité |
| WAITING_CLIENT_APPROVAL | WAITING_CLIENT_APPROVAL | Waiting Client Approval | En Attente d'Approbation Client |
| READY_TO_DISBURSE | READY_TO_DISBURSE | Ready to Disburse | Prêt à être Déboursé |
| DISBURSE | DISBURSE | Disbursed | Déboursé |
| REJECTED | REJECTED | Rejected | Rejeté |

## Key Files

### New
- `frontend/src/utils/statusMapping.ts` — Central status mapping utility

### Updated
- `frontend/src/locales/en/common.json` — English translations
- `frontend/src/locales/fr/common.json` — French translations
- 5 components that display status

## How to Use in Code

### Display Status with Translation
```typescript
import { getStatusKey } from '@/utils/statusMapping';
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('common');

// Display translated status
<span>{t(getStatusKey(status))}</span>
```

### Display Status with Colors
```typescript
import { getStatusKey, getStatusColor } from '@/utils/statusMapping';

<span className={`${getStatusColor(status).bg} ${getStatusColor(status).text}`}>
  {t(getStatusKey(status))}
</span>
```

### Get All Statuses (for dropdowns/filters)
```typescript
import { getAllStatuses, getStatusKey } from '@/utils/statusMapping';

<select>
  {getAllStatuses().map(status => (
    <option key={status} value={status}>
      {t(getStatusKey(status))}
    </option>
  ))}
</select>
```

## Pages Updated

✅ **Demandes Page** (`/demandes`)
- Status filter dropdown now uses mapping
- Status stats cards use mapped translations
- Status badges in table use translations

✅ **Dossier List Page** (`/analyse/dossiers`)
- Status badges in table use translations

✅ **Dossier Analysis Page** (`/analyse/dossiers/:id`)
- Status badge in header uses translation

✅ **Dashboard** (`/dashboard`)
- Recent demandes section displays translated status

✅ **Step 1 Client View** (in dossier analysis)
- Dossier status displays as translation
- Credit history status displays as translation

## Testing Scenarios

### Test Status Display
1. Go to **Demandes** page
2. Verify status column shows labels like "Draft", "Submitted", "In Analysis" (not "DRAFT", "SUBMITTED", "ANALYSE")
3. Create a new demande with status DRAFT
4. Verify status displays as "Draft" (not "DRAFT")

### Test Filters
1. Go to **Demandes** page
2. Click the status filter dropdown
3. Verify all options show translated labels, not raw enum values
4. Select different statuses and verify filtering works

### Test Language Switching
1. Go to any page showing status
2. Switch language (if available)
3. Verify status labels change to French
4. Switch back to English
5. Verify labels change back to English

### Test Badge Colors
1. Navigate through demandes with different statuses
2. Verify each status has distinct color styling (Draft=amber, Submitted=blue, Analyse=emerald, etc.)

## Color Mapping

| Status | Badge Color | Tailwind Classes |
|--------|-------------|------------------|
| DRAFT | Gray | bg-gray-100 text-gray-700 |
| SUBMITTED | Blue | bg-blue-100 text-blue-700 |
| ANALYSE | Amber | bg-amber-100 text-amber-700 |
| CHECK_BEFORE_COMMITTEE | Purple | bg-purple-100 text-purple-700 |
| CREDIT_RISK_ANALYSIS | Orange | bg-orange-100 text-orange-700 |
| COMMITTEE | Indigo | bg-indigo-100 text-indigo-700 |
| WAITING_CLIENT_APPROVAL | Cyan | bg-cyan-100 text-cyan-700 |
| READY_TO_DISBURSE | Emerald | bg-emerald-100 text-emerald-700 |
| DISBURSE | Green | bg-green-100 text-green-700 |
| REJECTED | Red | bg-red-100 text-red-700 |

## Build Status

✅ **Frontend**: Built successfully (1.18s)  
✅ **No TypeScript errors**  
✅ **All components updated**  
✅ **All translations added**  

## Common Issues & Solutions

### Issue: Status shows as "DRAFT" instead of "Draft"
**Solution**: Make sure you're using `t(getStatusKey(status))`, not just `status`

### Issue: Translation key missing error
**Solution**: All keys are already added to i18n files, but verify you're using lowercase keys like `dossier.status.draft`

### Issue: Wrong color for status
**Solution**: Use `getStatusColor(status).bg` and `getStatusColor(status).text` for consistent colors

### Issue: Status not translating when language changes
**Solution**: Ensure you're using `useTranslation()` hook and the t() function for all text

## Backward Compatibility

✅ Backend API unchanged — still returns raw enum values  
✅ Database schema unchanged — values remain the same  
✅ Type definitions updated but compatible  
✅ No breaking changes to existing code  

## Migration Path (if extending)

To add a new status:

1. Add to backend enum (`DemandeStatut` in Java)
2. Add to frontend type (`DemandeStatut` in TypeScript)
3. Add to `STATUS_TO_I18N_KEY` mapping in `statusMapping.ts`
4. Add translation keys to both i18n files (`dossier.status.new_status`)
5. Add color to `getStatusColor()` function if needed
6. Done! All components will automatically support the new status

---

**Created**: 2026-04-21  
**Status**: ✅ Complete and tested  
**Frontend Build**: ✅ Successful
