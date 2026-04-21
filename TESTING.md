# Testing Guide: Unified "Start Analysis" Feature

## Prerequisites
- All 4 PostgreSQL databases running (`docker-compose up -d`)
- All 4 backend services running (gestionnaire, client, nouvelle_demande, analyse)
- Frontend dev server running

## Test Scenario: Complete "Start Analysis" Workflow

### Step 1: Login
- Navigate to http://localhost:3000/login
- Login as FRONT_OFFICE user
- Should redirect to dashboard

### Step 2: Create a New Demande
- Go to **Demandes** → **New Demande**
- Select a client from the dropdown
- Fill in required fields:
  - Loan Purpose: "Business expansion"
  - Requested Amount: 50000
  - Duration: 12 months
  - Product ID: "PROD-001"
  - Asset Type: "IMMOBILIER"
  - Monthly Repayment Capacity: 5000
  - Application Channel: "AGENCE"
  - Check consent box
- Click **Create** (button should say "Creating...")
- Should show success toast and redirect to demandes list

**Expected Result:**
- Demande created with status **DRAFT**
- Demande appears in list with "DRAFT" badge

### Step 3: Submit the Demande
- In demandes list, find the newly created demande
- Click **Submit** button
- Should show loading spinner with "Submitting..."

**Expected Result:**
- Status changes to **SUBMITTED** in the table
- Success toast appears
- Button disappears (no more Submit button visible)

### Step 4: Start Analysis (MAIN TEST)
- Demande status should now be **SUBMITTED**
- Click **Start Analysis** button (should be visible only for SUBMITTED status)
- Should show loading spinner with "Starting..."

**Expected Result - CRITICAL:**
1. ✅ Loading spinner appears during operation
2. ✅ Backend logs show: "Created analysis dossier {id} for demande {id}"
3. ✅ Backend logs show: "Updated demande {id} status to ANALYSE"
4. ✅ Success toast appears: "Analysis started successfully"
5. ✅ Status in table changes from **SUBMITTED** → **ANALYSE**
6. ✅ **Start Analysis button DISAPPEARS** (no longer visible)
7. ✅ After ~1 second, auto-redirects to `/analyse/dossiers/{dossierId}`

### Step 5: Verify Persistence
- Refresh the page (Demandes list)
- Find the demande by its ID

**Expected Result:**
- Status still shows **ANALYSE** (persisted to database)
- "Start Analysis" button is NOT present
- Other buttons (if any for ANALYSE status) should be visible

### Step 6: Verify Dossier Page
- Should be on the dossier analysis page
- Navigate to Analyses → Dossiers
- Find the dossier by ID
- Click on it to view Step 1

**Expected Result:**
- Dossier displays correctly
- Client information section shows:
  - **General Information** (not "Agency Information")
    - Agence Libellé
    - Assigned Manager Name
    - Request Creation Date
    - Location
  - Client personal/company info (varies by client type)
  - Secondary phone, address fields visible
  - Risk level displayed
  - Manager information visible

## Debugging Checklist

### If "Start Analysis" button doesn't appear:
- [ ] Demande status is exactly **SUBMITTED** (check database)
- [ ] User has FRONT_OFFICE or CRO role
- [ ] Frontend rebuilt after changes

### If button appears but doesn't respond when clicked:
- [ ] Frontend dev console shows no JavaScript errors
- [ ] Check network tab: POST to `/api/demandes/{id}/start-analysis` sent
- [ ] Check response status code

### If Error: "401 Unauthorized":
- [ ] nouvelle_demande service is running
- [ ] Analyse service is running
- [ ] Authorization header is being forwarded (check DemandeResource line ~118)
- [ ] Backend logs show the POST request reaching nouvelle_demande

### If Error: "Failed to create analysis dossier":
- [ ] Analyse service is running on port 8084
- [ ] Demande ID exists
- [ ] Check analyse service logs for detailed error
- [ ] Verify `analyse.service.url` in configuration matches running instance

### If Status doesn't update to ANALYSE:
- [ ] Database migration V2__update_status_values.sql was applied
- [ ] DemandeStatut enum includes ANALYSE value
- [ ] Check database: SELECT status FROM demande WHERE id = ?

## Backend Logs to Monitor

### nouvelle_demande service:
```
[org.acme.service.DemandeService] Created analysis dossier {id} for demande {id}
[org.acme.service.DemandeService] Updated demande {id} status to ANALYSE
```

### analyse service:
```
[org.acme.client.AnalyseServiceClient] Analysis dossier created: {id} for demande {id}
```

### If authorization fails:
```
[org.acme.client.AnalyseServiceClient] Analyse service returned status 401
```

## Database Verification

After test completes, verify database state:

```sql
-- Check demande status
SELECT id, status, client_id, created_at FROM demande WHERE id = ? ORDER BY created_at DESC LIMIT 1;

-- Check dossier was created
SELECT id, status, demande_id, client_id FROM analyse_dossier WHERE demande_id = ? ORDER BY created_at DESC LIMIT 1;

-- Verify status enum has 10 values
SELECT * FROM demande_statut_ref ORDER BY statut;
```

## Expected Database State

After successful test:
- **demande table**: status = 'ANALYSE'
- **analyse_dossier table**: dossier created with status matching demande at creation time
- **demande_statut_ref**: 10 rows (DRAFT through REJECTED)

---

**Test completed successfully when:**
1. All 7 Expected Results from Steps 1-6 are satisfied
2. No 401 Unauthorized errors in logs
3. Status persists after page refresh
4. Button visibility follows rules (appears only for SUBMITTED, disappears for ANALYSE)
