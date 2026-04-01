# Multi-Language Support Implementation Guide

**Status**: ✅ COMPLETE  
**Version**: 1.0  
**Date**: March 26, 2026  
**Language Support**: English (en), Français (fr)

---

## 📋 What Was Implemented

### 1. **Database Layer**
- ✅ New migration file: `V2.0__Add_internationalization_support.sql`
- ✅ New tables:
  - `languages` - Supported languages (en, fr)
  - `role_translations` - Role label/description translations
  - `screen_translations` - Screen label translations
  - `permission_type_translations` - Permission type label translations
- ✅ Updated `gestionnaire` table with `preferred_language` column
- ✅ Pre-seeded translations for all existing roles, screens, and permission types

### 2. **Entity Layer** 
New JPA Entities created:
- ✅ `Language.java` - Language definition
- ✅ `RoleTranslation.java` - Role translations with lazy loading
- ✅ `ScreenTranslation.java` - Screen translations
- ✅ `PermissionTypeTranslation.java` - Permission type translations
- ✅ Updated `Gestionnaire.java` - Added `preferredLanguage` field

### 3. **Service Layer**
- ✅ `TranslationService.java` - Core translation management service with:
  - `getRoleWithTranslations(roleId, language)` - Get single role
  - `getAllRolesWithTranslations(language)` - Get all roles
  - `getScreenWithTranslations(screenId, language)` - Get single screen
  - `getAllScreensWithTranslations(language)` - Get all screens
  - `getPermissionTypeWithTranslations(typeId, language)` - Get single permission type
  - `getAllPermissionTypesWithTranslations(language)` - Get all permission types
  - Automatic fallback to English if translation missing
  - Language code validation

### 4. **API Layer**
- ✅ `LanguageResource.java` - New endpoints for translation management:
  - `GET /api/languages` - List supported languages
  - `GET /api/languages/{code}` - Get language details
  - `GET /api/translations/roles?language=fr` - Get roles with translations
  - `GET /api/translations/roles/{id}?language=fr` - Get single role
  - `GET /api/translations/screens?language=fr` - Get screens with translations
  - `GET /api/translations/screens/{id}?language=fr` - Get single screen
  - `GET /api/translations/permissions?language=fr` - Get permission types
  - `GET /api/translations/permissions/{id}?language=fr` - Get single permission type

- ✅ Updated `RoleResource.java`:
  - Added `TranslationService` injection
  - Enhanced `getAllRoles()` with optional `language` parameter
  - Enhanced `getRoleById()` with optional `language` parameter
  - Backward compatible (returns English if no language specified)

---

## 🗄️ Database Schema (New Tables)

### languages
```sql
id (SERIAL PRIMARY KEY)
code (VARCHAR(5) UNIQUE) - 'en', 'fr'
name (VARCHAR(50)) - 'English', 'Français'
is_active (BOOLEAN DEFAULT TRUE)
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
```

### role_translations
```sql
id (BIGSERIAL PRIMARY KEY)
role_id (BIGINT REFERENCES roles(id) ON DELETE CASCADE)
language_id (INTEGER REFERENCES languages(id) ON DELETE CASCADE)
label (VARCHAR(200) NOT NULL) - Translated label
description (TEXT) - Translated description
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
UNIQUE(role_id, language_id)
```

### screen_translations
```sql
id (BIGSERIAL PRIMARY KEY)
screen_id (BIGINT REFERENCES screens(id) ON DELETE CASCADE)
language_id (INTEGER REFERENCES languages(id) ON DELETE CASCADE)
label (VARCHAR(200) NOT NULL)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
UNIQUE(screen_id, language_id)
```

### permission_type_translations
```sql
id (BIGSERIAL PRIMARY KEY)
permission_type_id (BIGINT REFERENCES permission_types(id) ON DELETE CASCADE)
language_id (INTEGER REFERENCES languages(id) ON DELETE CASCADE)
label (VARCHAR(100) NOT NULL)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
UNIQUE(permission_type_id, language_id)
```

---

## 📊 Pre-Seeded Translations

### Roles
| Code | English | Français |
|------|---------|----------|
| SUPER_ADMIN | Super Administrator | Super Administrateur |
| CRO | Client Relationship Officer | Agent Relations Client |
| BRANCH_DM | Branch Decision Maker | Décideur Succursale |
| HEAD_OFFICE_DM | Head Office Decision Maker | Décideur Siège |
| RISK_ANALYST | Credit Risk Analyst | Analyste Risque Crédit |
| FRONT_OFFICE | Front Office | Front Office |
| READ_ONLY | Read Only User | Utilisateur Lecture Seule |
| TECH_USER | Technical User (UAT only) | Utilisateur Technique (UAT) |

### Screens
| Code | English | Français |
|------|---------|----------|
| HOME | Home Page | Page Accueil |
| NEW_APP | New Application | Nouvelle Demande |
| LAF | Loan Application Form | Formulaire Demande Crédit |
| CHECKLIST | Checklist | Checklist |
| CRA_FORM | CRA Form | Formulaire CRA |
| LCM_FORM | LCM Form | Formulaire LCM |
| VISIT_FORM | Management Visit Form | Formulaire Visite Gestion |

### Permission Types
| Code | English | Français |
|------|---------|----------|
| READ | Read | Lecture |
| WRITE | Write | Écriture |
| PARTIAL_WRITE | Partial Write | Écriture Partielle |
| ASSIGNED_WRITE | Assigned Write | Écriture Assignée |

---

## 🚀 How to Deploy

### Step 1: Drop Old Database (if exists)
```powershell
docker exec -it gestionnaire-postgres psql -U admin -d postgres -c "DROP DATABASE IF EXISTS gestionnaire_db;"
docker exec -it gestionnaire-postgres psql -U admin -d postgres -c "CREATE DATABASE gestionnaire_db;"
```

### Step 2: Clean Build
```powershell
cd d:\CrediWise\backend\gestionner_microservice\gestionner_backend
mvn clean package
```

Expected output:
```
[INFO] BUILD SUCCESS
[INFO] Total time: XX.XXs
```

### Step 3: Run Application
```powershell
mvn quarkus:dev
```

Expected Flyway logs:
```
[org.flywaydb.core.internal.command.DbMigrate] Migrating schema "public" to version 1.0 - Initial schema
[org.flywaydb.core.internal.command.DbMigrate] Migrating schema "public" to version 2.0 - Add internationalization support
[org.flywaydb.core.internal.command.DbMigrate] Successfully applied 2 migrations to schema "public"
```

### Step 4: Verify Database
```powershell
docker exec -it gestionnaire-postgres psql -U admin -d gestionnaire_db -c "\dt"
```

Should show 12 tables including new translation tables.

### Step 5: Test API
```powershell
# List languages
curl "http://localhost:8080/api/languages"

# Get all roles in English (default)
curl "http://localhost:8080/api/roles"

# Get all roles in French
curl "http://localhost:8080/api/translations/roles?language=fr"

# Get specific role in French
curl "http://localhost:8080/api/translations/roles/1?language=fr"

# Get screens in French
curl "http://localhost:8080/api/translations/screens?language=fr"

# Get permission types in French
curl "http://localhost:8080/api/translations/permissions?language=fr"
```

---

## 🔄 How It Works (Architecture Flow)

```
Frontend Request
    ↓
GET /api/roles?language=fr
    ↓
RoleResource.getAllRoles(language="fr")
    ↓
TranslationService.getAllRolesWithTranslations("fr")
    ↓
EntityManager Query:
  SELECT r.id, r.code, rt.label, rt.description, r.isActive
  FROM RoleTranslation rt
  JOIN rt.role r
  JOIN rt.language l
  WHERE l.code = 'fr' AND r.isActive = TRUE
    ↓
Database returns translated rows
    ↓
Service converts to Map<String, Object>
    ↓
REST resource returns JSON response
    ↓
Frontend displays French labels
```

### Fallback Mechanism
```
User requests language: "de" (German - not supported)
    ↓
TranslationService.getValidLanguageCode("de")
    ↓
Language lookup fails
    ↓
LOG WARN: "Invalid language code: de. Using default: en"
    ↓
Return English translation
```

---

## 📱 Frontend Integration

### Option 1: Language Query Parameter (Recommended)
```javascript
// User selects French from dropdown
const language = 'fr';

// Fetch roles in French
fetch(`/api/translations/roles?language=${language}`)
  .then(r => r.json())
  .then(roles => {
    // roles[0].label is now in French
    console.log(roles[0].label); // "Super Administrateur"
  });
```

### Option 2: User Profile Preference
```javascript
// Get user's preferred language from profile
fetch(`/api/gestionnaires/me`)
  .then(r => r.json())
  .then(user => {
    // user.preferredLanguage = "fr"
    return fetch(`/api/translations/roles?language=${user.preferredLanguage}`);
  });
```

### Option 3: Accept-Language Header (Future)
Could implement using `@HeaderParam("Accept-Language")` in resources.

---

## 🎯 Usage Examples

### Get User's Profile with Language Preference
```
GET /api/gestionnaires/{userId}

Response:
{
  "id": "uuid...",
  "email": "user@example.com",
  "firstName": "Ahmed",
  "lastName": "Ben Ali",
  "role": "CRO",
  "preferredLanguage": "fr",
  "isActive": true,
  "createdAt": "2026-03-26T10:00:00"
}
```

### Get All Roles in User's Language
```
GET /api/translations/roles?language=fr

Response:
{
  "data": [
    {
      "id": 2,
      "code": "CRO",
      "label": "Agent Relations Client",
      "description": "Gère les demandes des clients",
      "isActive": true
    },
    {
      "id": 1,
      "code": "SUPER_ADMIN",
      "label": "Super Administrateur",
      "description": "Accès complet au système",
      "isActive": true
    }
  ],
  "count": 2,
  "language": "fr"
}
```

### Get Screens with Permissions in User's Language
```
GET /api/translations/screens?language=fr

Response:
{
  "data": [
    {
      "id": 1,
      "code": "HOME",
      "label": "Page Accueil"
    },
    {
      "id": 3,
      "code": "LAF",
      "label": "Formulaire Demande Crédit"
    }
  ],
  "count": 7,
  "language": "fr"
}
```

---

## 🧪 Testing Checklist

- [ ] Database migrations ran successfully
- [ ] All translation tables created
- [ ] Pre-seeded French translations exist
- [ ] `GET /api/languages` returns en, fr
- [ ] `GET /api/roles?language=fr` returns French labels
- [ ] `GET /api/roles?language=en` returns English labels
- [ ] `GET /api/roles` (no language) returns original English
- [ ] Fallback works: invalid language defaults to en
- [ ] `GET /api/gestionnaires` shows `preferredLanguage` field
- [ ] Swagger/OpenAPI docs updated with language parameter
- [ ] All existing tests still pass: `mvn test`

---

## 🔐 Security Considerations

1. **No SQL Injection**: Using JPA/Hibernate parameterized queries
2. **Language Validation**: Invalid language codes rejected, default to en
3. **Access Control**: Language endpoints don't expose sensitive data
4. **Rate Limiting**: Consider adding if translations heavily accessed
5. **Caching**: Translation results can be cached (Redis) for performance

---

## ⚡ Performance Notes

### Query Optimization
- Indexes on `role_translations(role_id, language_id)`
- Lazy loading prevents N+1 queries
- Use `DISTINCT` in `getAllRoles` to avoid duplicates

### Database Stats
```sql
-- Check index usage
SELECT schemaname, tablename, indexname FROM pg_indexes 
WHERE tablename IN ('role_translations', 'screen_translations', 'permission_type_translations');

-- Check row counts
SELECT COUNT(*) FROM role_translations;  -- Should be 16 (8 roles × 2 languages)
SELECT COUNT(*) FROM screen_translations;  -- Should be 14 (7 screens × 2 languages)
```

### Caching Strategy (Future)
```java
@CacheInvalidateAll
public void updateRoleTranslation(...) { }

@Cached(cacheName = "roles-translations")
public Map<String, Object> getRoleWithTranslations(...) { }
```

---

## 🛠️ Maintenance & Future Enhancements

### Adding New Languages
1. Insert into `languages` table: `INSERT INTO languages (code, name) VALUES ('es', 'Español');`
2. Create translations: `INSERT INTO role_translations ... (for Spanish labels)`
3. No code changes needed!

### Adding New Roles
1. Insert role in `roles` table
2. Insert translations in `role_translations` for both en, fr
3. Frontend automatically gets translations via API

### API Versioning
To maintain backward compatibility:
- Keep `GET /api/roles` returning English
- Add `GET /api/v2/roles?language=...` for new clients

---

## 📞 Troubleshooting

### "Translation not found" Error
**Cause**: Missing translation in database  
**Fix**: 
```sql
INSERT INTO role_translations (role_id, language_id, label, description)
VALUES (1, 2, 'Translated Label', 'Translated Description');
```

### "ClassNotFoundException: RoleTranslation"
**Cause**: New entity not compiled  
**Fix**: `mvn clean package` and restart

### "No tables created after deploy"
**Cause**: Migration not executed  
**Fix**: Check Flyway logs, manually run SQL migration, verify DB permissions

### Performance Degradation
**Cause**: Missing indexes or N+1 queries  
**Fix**: Verify `FetchType.LAZY`, check explain plans, add caching

---

## 📄 Files Changed/Created

### New Files
```
✅ V2.0__Add_internationalization_support.sql
✅ Language.java
✅ RoleTranslation.java
✅ ScreenTranslation.java
✅ PermissionTypeTranslation.java
✅ TranslationService.java
✅ LanguageResource.java
✅ AGENTS.md
✅ i18n_IMPLEMENTATION_GUIDE.md (this file)
```

### Modified Files
```
✅ Gestionnaire.java (added preferredLanguage field)
✅ RoleResource.java (added language parameter support)
```

---

## ✨ Summary

Your system now supports **professional multi-language support** with:
- ✅ Database-backed translations for all content
- ✅ Seamless API integration with language parameters
- ✅ Automatic fallback to English
- ✅ Pre-seeded French translations
- ✅ User language preferences
- ✅ Backward compatible (existing code still works)
- ✅ Quarkus best practices
- ✅ Production-ready error handling

**Next Steps for Frontend Team**:
1. Update UI to show language selector
2. Store user's language preference in `gestionnaire.preferredLanguage`
3. Pass `language` query parameter when fetching data
4. Update Swagger/OpenAPI client generators

---

**Questions?** Reference `AGENTS.md` for architecture details or consult the codebase examples.

