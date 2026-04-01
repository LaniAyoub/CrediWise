# CrediWise Security Architecture & Authentication Process

## 📋 Table of Contents

1. [Overview](#overview)
2. [Cryptographic Keys](#cryptographic-keys)
3. [JWT Token Mechanism](#jwt-token-mechanism)
4. [Authentication Flow](#authentication-flow)
5. [Password Security](#password-security)
6. [Authorization & Access Control](#authorization--access-control)
7. [Security Best Practices](#security-best-practices)
8. [Configuration & Setup](#configuration--setup)
9. [Deployment Security](#deployment-security)

---

## Overview

CrediWise uses a **stateless, token-based authentication system** built on industry-standard JWT (JSON Web Tokens) and RSA-2048 cryptography. This provides:

- ✅ **Scalability**: No session server needed
- ✅ **Security**: Cryptographic verification of token authenticity
- ✅ **Statelessness**: Each request is independently verified
- ✅ **Multi-service Support**: Tokens work across microservices

---

## Cryptographic Keys

### Key Generation Details

```
Algorithm: RSA (Rivest-Shamir-Adleman)
Key Size: 2048 bits
Format: PEM (Privacy Enhanced Mail)
Encoding: Base64
```

### 1. Private Key (`privateKey.pem`)

**Location**: `backend/gestionnaire/src/main/resources/privateKey.pem`

**Purpose**: Used by the **authentication server** to **sign JWT tokens**

**Characteristics**:
- 🔒 **Highly Sensitive** - Must be kept secret
- Size: ~1,720 bytes (Base64 encoded)
- Used only during login process
- Cannot be reconstructed from public key

**What it does**:
```
1. User logs in with email + password
2. Server validates credentials against database
3. Server uses PRIVATE KEY to cryptographically SIGN the JWT token
4. Signature mathematically binds the token to the server
5. Token is sent to client

Anyone can verify the token came from the legitimate server using the public key,
but only the server (with the private key) can create valid tokens.
```

**Security**: 
- ⚠️ **MUST BE KEPT SECRET**
- If compromised:
  - Attackers can forge valid tokens
  - Immediate rotation required
  - All existing tokens become untrusted

### 2. Public Key (`publicKey.pem`)

**Location**: `backend/gestionnaire/src/main/resources/publicKey.pem`

**Purpose**: Used to **verify JWT tokens** are legitimate

**Characteristics**:
- 🟢 **Safe to Share** - Can be distributed publicly
- Size: ~454 bytes (Base64 encoded)
- Mathematically linked to private key
- Cannot be used to create tokens, only verify them

**What it does**:
```
1. Client sends request with JWT token in header
2. Server uses PUBLIC KEY to verify token signature
3. Verification confirms:
   - Token wasn't modified/tampered with
   - Token came from the legitimate server
   - Token is still valid (not expired)
4. If verified → Request processed
5. If invalid → 401 Unauthorized error

The public key is mathematically derived from the private key,
making it impossible to forge tokens without the private key.
```

**Security**:
- 🟢 **Safe to distribute**
- Can be shared with:
  - Frontend applications
  - Third-party services
  - API clients
  - Public documentation

### RSA Cryptography Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    KEY GENERATION (One-time)                    │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────┐
  │  Generate 2048-bit RSA Key Pair  │
  └──────────┬───────────────────────┘
             │
             ├─────────────────────────────────────┐
             │                                     │
             ▼                                     ▼
    ┌─────────────────┐             ┌──────────────────┐
    │  Private Key    │             │   Public Key     │
    │  (SECRET)       │             │   (SHAREABLE)    │
    │                 │             │                  │
    │ Signs tokens    │             │ Verifies tokens  │
    │ Creates JWTs    │             │ Checks validity  │
    │ 1,720 bytes     │             │ 454 bytes        │
    └─────────────────┘             └──────────────────┘
             │                             │
             │                             │
             └────────────────────────────┘
                Mathematically linked
               (Can't recreate without original)
```

---

## JWT Token Mechanism

### JWT Structure

A JWT token consists of 3 parts separated by dots (`.`):

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiJ1c2VyLWlkIiwiaWF0IjoxNjc1MDAwMDAwLCJleHAiOjE2NzUwODY0MDB9.
SIGNATURE_HERE

│                                    │
├─ HEADER                            ├─ PAYLOAD                       ├─ SIGNATURE
│ {                                  │ {                              │
│   "alg": "RS256",                  │   "sub": "user-id",            │ Created using
│   "typ": "JWT"                     │   "email": "user@email.com",   │ Private Key
│ }                                  │   "role": "ADMIN",             │
│                                    │   "iat": 1675000000,           │
│                                    │   "exp": 1675086400,           │ Verified using
│                                    │   "iss": "gestionnaire-service"│ Public Key
│                                    │ }                              │
```

### JWT Payload (Claims)

The token contains these user claims:

```json
{
  "sub": "user-id",                    // Subject (user ID)
  "email": "system@creditwise.com",    // User's email
  "firstName": "System",               // First name
  "lastName": "Admin",                 // Last name
  "role": "TECH_USER",                 // User role
  "agenceId": "100",                   // Associated agency
  "iss": "gestionnaire-service",       // Issuer (our service)
  "aud": "gestionnaire-api",           // Audience (intended service)
  "iat": 1675000000,                   // Issued At (timestamp)
  "exp": 1675086400,                   // Expiration (24 hours later)
  "groups": ["TECH_USER"]              // Roles for authorization
}
```

### Token Lifetime

```
Token Validity: 24 hours (86,400 seconds)

Timeline:
├─ 0 hours: User logs in, token issued
├─ 12 hours: Token still valid, user can use it
├─ 23 hours: Token still valid, user can use it
├─ 23:59 hours: Token still valid, user can use it
└─ 24 hours: Token EXPIRED
   └─ Next request: 401 Unauthorized
      └─ User must log in again
```

---

## Authentication Flow

### Step 1: User Submits Credentials

```
┌──────────┐
│  CLIENT  │
└────┬─────┘
     │
     │ POST /api/auth/login
     │ Content-Type: application/json
     │ {
     │   "email": "system@creditwise.com",
     │   "password": "ChangeMe123!"
     │ }
     │
     ▼
┌──────────────────────┐
│  GESTIONNAIRE API    │
│  (AuthResource)      │
└──────────────────────┘
```

### Step 2: Password Validation

```
┌──────────────────────┐
│  AuthResource.login()│
└────┬─────────────────┘
     │
     │ 1. Query database for user by email
     │
     ▼
┌──────────────────┐         ┌────────────────────┐
│  DATABASE        │◄────────┤  findByEmail()     │
│  gestionnaire_db │         │  from repository   │
│  (users table)   │         └────────────────────┘
└────┬─────────────┘
     │
     │ 2. Get user record
     │    (includes hashed password)
     │
     ▼
┌──────────────────────────────────┐
│  Password Verification           │
│  ─────────────────────────────── │
│  User's plaintext password:      │
│  "ChangeMe123!"                  │
│           +                      │
│  Database hashed password:       │
│  "$2a$10$N9qo8uLO..."           │
│           ↓                      │
│  BcryptUtil.matches()            │
│  (BCrypt algorithm)              │
│           ↓                      │
│  Match? YES ✓                    │
└──────────────────────────────────┘
```

### Step 3: JWT Token Generation

```
┌──────────────────────────────┐
│  Token Generation            │
│  ──────────────────────────  │
│  Jwt.issuer(...)             │
│    .subject(user.getId())    │
│    .claim("email", ...)      │
│    .claim("role", ...)       │
│    .expiresAt(now + 24h)     │
│    .sign()  ← Uses PRIVATE   │
│             KEY to sign      │
└────┬─────────────────────────┘
     │
     │ Token Created:
     │ eyJhbGciOiJSUzI1NiI...
     │
     ▼
┌──────────────────┐
│  Response: 200   │
│  {               │
│    "accessToken" │
│      "eyJhbGc...",
│    "expiresAt":  │
│      "2026-04-01",
│    "role": "ADMIN"
│  }               │
└──────────────────┘
     │
     ▼
┌──────────┐
│  CLIENT  │
│  Stores  │
│  Token   │
└──────────┘
```

### Step 4: Using Token for Subsequent Requests

```
┌──────────┐
│  CLIENT  │
└────┬─────┘
     │
     │ GET /api/gestionnaires
     │ Authorization: Bearer eyJhbGciOiJSUzI1NiI...
     │
     ▼
┌──────────────────────┐
│  GESTIONNAIRE API    │
│  (AuthFilter/        │
│   GestionnaireResource)
└────┬─────────────────┘
     │
     │ 1. Extract token from header
     │
     ▼
┌──────────────────────────────┐
│  Token Verification          │
│  ──────────────────────────  │
│  Token signature:            │
│  "SIGNATURE_HERE"            │
│           +                  │
│  Public Key:                 │
│  (from publicKey.pem)        │
│           ↓                  │
│  Verify signature matches    │
│           ↓                  │
│  Valid? YES ✓                │
│           ↓                  │
│  Check expiration            │
│           ↓                  │
│  Not expired? YES ✓          │
└────┬─────────────────────────┘
     │
     │ 2. Extract user claims
     │    (email, role, etc.)
     │
     ▼
┌──────────────────────────────┐
│  Authorization Check         │
│  ──────────────────────────  │
│  Required role: ADMIN        │
│  User's role: TECH_USER      │
│           ↓                  │
│  Match? NO ✗                 │
│           ↓                  │
│  Return 403 Forbidden        │
└──────────────────────────────┘
     │
     ▼
┌──────────┐
│  CLIENT  │
│  Receives│
│  403     │
└──────────┘
```

---

## Password Security

### BCrypt Hashing Algorithm

CrediWise uses **BCrypt** for password hashing:

```
Algorithm: BCrypt
Cost Factor: 10 (configurable)
Output: 60-character hash

Example:
Password: "ChangeMe123!"
         ↓
Hashed:  $2a$10$N9qo8uLOickgx2ZMRZoMyezEwWltWVJrwcqWr5D2/eFMI5ZeH6K4m

Why BCrypt?
✓ Salted: Each hash includes random salt
✓ Slow: Intentionally slow (resists brute-force)
✓ Adaptive: Cost factor can be increased as computers get faster
✓ Industry Standard: Used by major tech companies
```

### Password Hashing Flow

```
USER REGISTRATION / PASSWORD CHANGE:

┌──────────────────┐
│  Plaintext       │
│  "ChangeMe123!" │
└────┬─────────────┘
     │
     ▼
┌──────────────────────────────┐
│  BcryptUtil.hashPassword()  │
│  Alg: BCrypt, Cost: 10       │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│  Hashed Password             │
│  $2a$10$N9qo8uLO...          │
│  (60 characters)             │
│                              │
│  Characteristics:            │
│  ✓ Contains random salt      │
│  ✓ Irreversible (one-way)    │
│  ✓ Computationally expensive │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────┐
│  Database        │
│  Store Hash      │
│  (NOT plaintext) │
└──────────────────┘
```

### Login Password Verification

```
LOGIN:

┌──────────────────┐
│  User enters     │
│  "ChangeMe123!" │
└────┬─────────────┘
     │
     ├─────────────────────────────────┐
     │                                 │
     ▼                                 ▼
┌──────────────┐              ┌────────────────────┐
│  Plaintext   │              │  Database Fetch    │
│  Password    │              │  Stored Hash:      │
│              │              │  $2a$10$N9qo8uLO..│
└────┬─────────┘              └────┬───────────────┘
     │                             │
     └──────────────┬──────────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │ BcryptUtil.matches()     │
        │                          │
        │ Hash plaintext password  │
        │ using salt from database │
        │ hash, compare results    │
        └────┬─────────────────────┘
             │
             ├─ Match? YES → Token issued ✓
             │
             └─ Match? NO → 401 Unauthorized ✗
```

---

## Authorization & Access Control

### Role-Based Access Control (RBAC)

CrediWise implements role-based authorization:

```
JWT Token Contains Role: "TECH_USER"
         ↓
Endpoint requires @RolesAllowed("ADMIN")
         ↓
Check: Is "TECH_USER" in ["ADMIN"]?
         ↓
NO → Return 403 Forbidden
         ↓
User cannot access this endpoint
```

### Available Roles

```
ADMIN          - Full system access, user management
TECH_USER      - System administration tasks
CRO            - Client Relationship Officer, sales/support
MANAGER        - Branch manager, limited staff management
OFFICER        - Regular operations officer
CUSTOM_ROLE    - Organization-specific roles
```

### Protected Endpoints Example

```java
// All Gestionnaire endpoints require token
@RolesAllowed({"ADMIN", "TECH_USER"})
public Response getAllGestionnaires() {
    // Only ADMIN and TECH_USER can access
}

// Some endpoints require specific roles
@RolesAllowed("ADMIN")
public Response deleteGestionnaire(UUID id) {
    // Only ADMIN can delete users
}
```

---

## Security Best Practices

### 1. Private Key Management

```
❌ DON'T:
- Commit to git repository
- Share with anyone
- Store in version control
- Log or print the key
- Hardcode in code

✅ DO:
- Store in environment variable (production)
- Use secrets manager (AWS Secrets, Azure Key Vault)
- Rotate periodically
- Restrict file permissions (chmod 400)
- Use separate keys per environment
```

### 2. Token Handling (Client Side)

```
❌ DON'T:
- Store token in localStorage (XSS vulnerable)
- Log token in console
- Send token in URL parameters
- Share token between users

✅ DO:
- Store in httpOnly cookie (XSS resistant)
- Include in Authorization header
- Refresh token before expiration
- Clear on logout
```

### 3. HTTPS in Production

```
DEVELOPMENT:
http://localhost:8080  ✓ Acceptable

PRODUCTION:
https://api.crediwise.com  ✓ REQUIRED
        ▲
        │
   TLS/SSL encryption
   Protects token in transit
   Prevents token interception
```

### 4. Token Expiration

```
Current: 24 hours

For sensitive operations:
├─ Short-lived token: 15 minutes
├─ Refresh token: 30 days
└─ User re-authenticates for sensitive ops

Example:
Token issued: 3:00 PM
Token expires: 3:00 PM next day
After expiration: User must log in again
```

### 5. Database Password Storage

```
✓ All passwords hashed with BCrypt
✓ Never store plaintext passwords
✓ Use cost factor ≥ 10
✓ Each password has unique salt
✓ Hashes are 60 characters
```

---

## Configuration & Setup

### JWT Configuration File

**Location**: `src/main/resources/application.properties`

```properties
# JWT Token Signing
smallrye.jwt.sign.key.location=privateKey.pem
mp.jwt.verify.issuer=gestionnaire-service

# JWT Token Verification
mp.jwt.verify.publickey.location=publicKey.pem

# Token lifetime (in seconds, currently 86400 = 24 hours)
# Set in AuthResource.java: now.plus(24, ChronoUnit.HOURS)
```

### Key File Locations

```
Project Structure:
├── backend/
│   └── gestionnaire/
│       └── src/main/resources/
│           ├── privateKey.pem    ← Signing key (SECRET)
│           ├── publicKey.pem     ← Verification key (SHAREABLE)
│           └── application.properties
```

### Key Generation

Keys are generated once and reused:

```bash
# One-time generation (already done)
cd d:\CrediWise\backend\gestionnaire
javac GenerateKeys.java
java GenerateKeys

# This creates:
# - privateKey.pem (1,720 bytes)
# - publicKey.pem (454 bytes)
```

### Database Security

```
Database: PostgreSQL
Username: admin
Password: admin
Host: localhost:5432

⚠️ FOR DEVELOPMENT ONLY ⚠️

Production:
├─ Use strong passwords (32+ chars, mixed case)
├─ Use secrets manager for credentials
├─ Enable SSL connections
├─ Restrict network access
├─ Regular backups
├─ Enable query logging/audit
```

---

## Deployment Security

### Development Environment

```
Config: src/main/resources/application.properties

quarkus.datasource.username=admin
quarkus.datasource.password=admin
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/gestionnaire_db

Acceptable for:
✓ Local development
✓ Testing
✓ Integration environments
```

### Production Environment

```
Config: Environment Variables (DO NOT hardcode)

QUARKUS_DATASOURCE_USERNAME=${DB_USER}
QUARKUS_DATASOURCE_PASSWORD=${DB_PASSWORD}
QUARKUS_DATASOURCE_JDBC_URL=${DB_URL}

JWT_PRIVATE_KEY=${PRIVATE_KEY_CONTENT}
JWT_PUBLIC_KEY=${PUBLIC_KEY_CONTENT}

Deployment Checklist:
□ Use HTTPS/TLS for all communications
□ JWT keys stored in secrets manager
□ Database credentials in environment variables
□ Enable SQL injection prevention
□ Enable CORS only for trusted origins
□ Rate limiting enabled
□ Logging and monitoring active
□ Firewall rules enforced
□ Regular security audits
□ Keep dependencies updated
```

### Environment Variables Example

```bash
# .env.production (not committed to git)

# Database
DB_USER=crediwise_prod_user
DB_PASSWORD=SuperSecurePassword123!@#
DB_URL=jdbc:postgresql://prod-db.aws.amazon.com:5432/gestionnaire_db

# JWT Keys (multi-line)
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDU9gHVULLjLhRK
...
-----END PRIVATE KEY-----"

PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApjNaWUjYtMVh8T/tDbPE
...
-----END PUBLIC KEY-----"
```

### Key Rotation Strategy

```
Every 90 days:

1. Generate new key pair
2. Deploy new keys to production
3. Keep old key for 30 days (support old tokens)
4. After 30 days: Remove old key
5. Force all users to re-authenticate

Rotation Process:
├─ Generate new privateKey.pem and publicKey.pem
├─ Update application to support both keys temporarily
├─ Announce rotation to users
├─ Deploy new keys
├─ Wait 30 days
├─ Remove old keys
└─ Monitor for issues
```

---

## Security Monitoring & Logging

### What to Monitor

```
🔴 Critical Events:
├─ Failed login attempts (multiple in short time)
├─ Token verification failures
├─ Unauthorized access attempts (401/403 errors)
├─ Database connection errors
└─ Key rotation events

Log Format (Example):
{
  "timestamp": "2026-03-31T20:54:54Z",
  "event": "LOGIN_FAILED",
  "email": "attacker@test.com",
  "reason": "Invalid password",
  "ip_address": "192.168.1.100",
  "attempt_count": 3
}

Action: If 5+ failed attempts in 1 minute → Lock account temporarily
```

### Audit Trail

```
Track all sensitive operations:
├─ User login/logout
├─ Password changes
├─ User creation/deletion
├─ Role changes
├─ Gestionnaire updates
├─ Administrative actions

Retention: Keep audit logs for 1+ years
```

---

## Troubleshooting Security Issues

### Issue: "Invalid JWT Token" Error

```
Possible Causes:
1. Token expired
   Solution: Log in again to get new token

2. Token modified
   Solution: Use original token as-is

3. Public key missing
   Solution: Ensure publicKey.pem exists in resources

4. Token from different server
   Solution: Use token from correct server

5. Key mismatch
   Solution: Ensure public key matches private key used to sign
```

### Issue: "Unauthorized" (401) Error

```
Possible Causes:
1. No token provided
   Solution: Include "Authorization: Bearer <token>" header

2. Invalid token format
   Solution: Format should be "Bearer <token>" (with space)

3. Token expired
   Solution: Get new token via login endpoint

4. Token corrupted
   Solution: Copy token carefully, avoid whitespace
```

### Issue: "Forbidden" (403) Error

```
Possible Causes:
1. Insufficient permissions
   Solution: Your role doesn't have access to this endpoint

2. Endpoint requires ADMIN role
   Solution: Ask admin to grant appropriate role

3. Token invalid
   Solution: Re-login to get valid token
```

---

## Summary

CrediWise Security Model:

```
┌─────────────────────────────────────────────────────────┐
│           SECURITY ARCHITECTURE SUMMARY                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  AUTHENTICATION:                                       │
│  ├─ Method: JWT with RSA-2048 cryptography            │
│  ├─ Password Hashing: BCrypt (cost factor 10)         │
│  └─ Token Lifetime: 24 hours                          │
│                                                        │
│  CRYPTOGRAPHY:                                        │
│  ├─ Private Key: Signs tokens (SECRET)               │
│  ├─ Public Key: Verifies tokens (SHAREABLE)          │
│  └─ Algorithm: RS256 (RSA with SHA-256)              │
│                                                        │
│  AUTHORIZATION:                                        │
│  ├─ Method: Role-Based Access Control (RBAC)         │
│  ├─ Roles: ADMIN, TECH_USER, CRO, MANAGER, etc.      │
│  └─ Enforcement: @RolesAllowed annotations           │
│                                                        │
│  BEST PRACTICES:                                       │
│  ├─ HTTPS in production                              │
│  ├─ Secrets manager for credentials                  │
│  ├─ Regular key rotation                             │
│  ├─ Comprehensive logging                            │
│  └─ Regular security audits                          │
│                                                        │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Login Process
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"system@creditwise.com","password":"ChangeMe123!"}'

Response:
{
  "accessToken": "eyJhbGc...",
  "expiresAt": "2026-04-01T20:54:54Z",
  "role": "ADMIN"
}
```

### Using Token
```bash
curl http://localhost:8080/api/gestionnaires \
  -H "Authorization: Bearer eyJhbGc..."

# Token automatically verified on every request
```

### Key Files
```
Private Key: backend/gestionnaire/src/main/resources/privateKey.pem
Public Key:  backend/gestionnaire/src/main/resources/publicKey.pem
Config:      backend/gestionnaire/src/main/resources/application.properties
```

---

**Document Version**: 1.0  
**Last Updated**: March 31, 2026  
**Status**: ✅ Complete  
**Security Level**: Comprehensive Documentation

For questions or security concerns, contact the development team.
