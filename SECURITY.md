# Security Improvements Documentation

This document outlines the security improvements implemented in this project.

## 🔐 Authentication & Authorization

### 1. Server-Side Route Protection
**File:** `middleware.ts`

- Next.js middleware validates JWT tokens before allowing access to protected routes
- Automatic redirect to login for unauthenticated users
- Role-based access control for admin routes
- Invalid tokens are automatically cleared

**Protected Routes:**
- `/dashboard/*` - Requires authentication
- `/contracts/*` - Requires authentication
- `/dashboard/users/*` - Requires admin role

### 2. Dual Token System
**Files:** `src/lib/jwt.ts`, `src/app/api/auth/login/route.ts`

**Access Token:**
- Short-lived (30 minutes)
- Stored in HTTP-only cookie
- Used for API authentication
- Automatic refresh when expired

**Refresh Token:**
- Long-lived (7 days)
- Stored in HTTP-only cookie with restricted path
- Stored in database for revocation capability
- Used only to obtain new access tokens

**Benefits:**
- Minimizes exposure window if token is compromised
- Enables session revocation (logout all devices)
- Reduces need for frequent re-authentication

### 3. Enhanced Cookie Security
**Changes:**
- `sameSite: 'strict'` - Prevents CSRF attacks
- `httpOnly: true` - Prevents JavaScript access (XSS protection)
- `secure: true` (production) - HTTPS-only transmission
- `path` restrictions on refresh token

### 4. Client-Side Auth Validation
**File:** `src/components/DashboardLayout.tsx`

- Always validates with server via `/api/auth/me`
- localStorage used only for quick UI rendering (cached data)
- Server response is authoritative
- Automatic cleanup on validation failure

## 🛡️ Attack Prevention

### 5. Rate Limiting
**Files:** `src/lib/rateLimit.ts`, `src/app/api/auth/login/route.ts`

**Configuration:**
- 5 login attempts per 15 minutes per IP address
- Automatic reset on successful login
- Returns 429 status code when limit exceeded
- Includes `Retry-After` header

**Implementation:**
- In-memory store (consider Redis for production scale)
- Automatic cleanup of expired entries
- Supports IP detection behind proxies

### 6. Strong Password Policy
**File:** `src/models/User.ts`

**Requirements:**
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Hash:** bcrypt with 12 salt rounds

## 🚀 Performance Optimization

### 7. Database Indexes
**File:** `src/models/Contract.ts`

**Single Indexes:**
- `contractNumber` - Fast lookup by contract number
- `bienSo` - Search by license plate
- `status` - Filter by workflow status
- `createdBy` - Query contracts by user

**Compound Indexes:**
- `{ status: 1, createdBy: 1 }` - User's contracts by status
- `{ createdAt: -1 }` - Sort by creation date
- `{ status: 1, createdAt: -1 }` - Filtered list sorted by date

## 🔑 Secrets Management

### 8. Environment Variables
**Files:** `.env.example`, `scripts/generate-secrets.js`

**Required Variables:**
```env
JWT_SECRET=<64-char-hex>
REFRESH_SECRET=<64-char-hex>
ENCRYPTION_KEY=<32-char-hex>
```

**Generate Secrets:**
```bash
node scripts/generate-secrets.js
```

**Security Rules:**
1. Never commit `.env` to version control
2. Use different secrets per environment
3. Rotate secrets every 3-6 months
4. Use secrets management service in production

## 📋 Setup Instructions

### First Time Setup

1. **Generate secrets:**
   ```bash
   node scripts/generate-secrets.js
   ```

2. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

3. **Update .env with generated secrets**

4. **Update MongoDB credentials**

5. **Install dependencies:**
   ```bash
   npm install
   ```

6. **Run database migrations** (if any)

### Production Deployment

1. **Use strong, unique secrets for production**
2. **Enable HTTPS** (required for secure cookies)
3. **Set `NODE_ENV=production`**
4. **Consider Redis for rate limiting** (scale)
5. **Use secrets management service** (AWS Secrets Manager, HashiCorp Vault)
6. **Enable MongoDB authentication**
7. **Set up monitoring and alerts**

## 🔄 Token Refresh Flow

```
1. User logs in
   → Access token (30min) + Refresh token (7days)

2. User makes API request
   → Middleware validates access token
   → If expired, returns 401

3. Frontend catches 401
   → Calls POST /api/auth/refresh
   → Receives new access token
   → Retries original request

4. User logs out
   → Clears cookies
   → Invalidates refresh token in database
```

## 🛠️ API Endpoints

### Authentication Endpoints

**POST /api/auth/login**
- Rate limited: 5 attempts per 15 minutes
- Returns: access token + refresh token (cookies)

**POST /api/auth/refresh**
- Validates refresh token
- Returns: new access token (cookie)

**POST /api/auth/logout**
- Invalidates refresh token in database
- Clears both cookies

**GET /api/auth/me**
- Returns current user info
- Requires valid access token

## ⚠️ Known Limitations

1. **Rate limiting is in-memory** - Won't work across multiple server instances
   - Solution: Use Redis for production

2. **No CAPTCHA** - Sophisticated bots can bypass rate limiting
   - Solution: Add reCAPTCHA after N failed attempts

3. **Session management** - No "active sessions" view for users
   - Solution: Store sessions in database with device info

4. **Password reset** - Not implemented
   - Solution: Add email-based password reset flow

## 📊 Security Checklist

- [x] Server-side route protection
- [x] JWT token validation
- [x] Token refresh mechanism
- [x] HTTP-only cookies
- [x] CSRF protection (sameSite: strict)
- [x] Rate limiting on login
- [x] Strong password policy
- [x] Password hashing (bcrypt)
- [x] Database indexes
- [x] Environment variable management
- [ ] CAPTCHA (recommended for production)
- [ ] Password reset flow
- [ ] Two-factor authentication (2FA)
- [ ] Security headers (CSP, HSTS)
- [ ] SQL injection prevention (✓ using Mongoose ORM)
- [ ] XSS prevention (✓ React escapes by default)

## 📝 Maintenance

### Regular Tasks

1. **Monitor failed login attempts**
2. **Review user sessions regularly**
3. **Rotate secrets quarterly**
4. **Update dependencies monthly**
5. **Audit security logs**
6. **Review and update RBAC policies**

### Incident Response

If credentials are compromised:
1. Immediately rotate all secrets
2. Force logout all users (clear refreshTokens from DB)
3. Notify affected users
4. Review access logs
5. Update security policies

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/authentication)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)