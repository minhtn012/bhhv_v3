# Security Migration Guide

## ⚠️ CRITICAL: Before Running the Application

### Step 1: Remove .env from Git (REQUIRED)

The `.env` file is currently tracked by git and contains exposed secrets. You MUST remove it:

```bash
# Remove .env from git tracking (keeps local file)
git rm --cached .env

# Commit the removal
git commit -m "security: Remove .env from version control"

# Push changes
git push
```

### Step 2: Generate New Secrets

The existing secrets in `.env` are compromised (committed to git). Generate new ones:

```bash
# Generate new secure secrets
node scripts/generate-secrets.js
```

Copy the output and update your `.env` file with the new values.

### Step 3: Update Environment Variables

Edit `.env` and ensure these are set:

```env
# MongoDB
MONGODB_URI=mongodb://username:password@localhost:27018/bhhv?authSource=admin
DB_NAME=bhhv

# JWT - Use values from generate-secrets.js
JWT_SECRET=<your-new-secret-here>
REFRESH_SECRET=<your-new-secret-here>

# Encryption - Use value from generate-secrets.js
ENCRYPTION_KEY=<your-new-key-here>

# API Keys
GEMINI_API_KEY=<your-api-key>

# Environment
NODE_ENV=development
```

### Step 4: Update Existing User Passwords

The password policy has been strengthened to require:
- Minimum 12 characters
- 1 uppercase, 1 lowercase, 1 number, 1 special character

**Existing users with weak passwords will need to reset their passwords.**

You have two options:

**Option A: Manual Update (Recommended for few users)**
```bash
# Connect to MongoDB
mongosh mongodb://dev:dev123@localhost:27018/bhhv --authSource admin

# List users with weak passwords
db.users.find({}, { username: 1, email: 1 })

# Manually ask users to change passwords via UI
```

**Option B: Programmatic Update (For many users)**
Create a migration script to force password reset on next login.

### Step 5: Clear Existing Sessions

Since we're implementing a new token system, clear all existing sessions:

```bash
# Connect to MongoDB
mongosh mongodb://dev:dev123@localhost:27018/bhhv --authSource admin

# Clear refresh tokens from all users
db.users.updateMany({}, { $unset: { refreshToken: 1, refreshTokenExpiry: 1 } })
```

### Step 6: Test the Application

```bash
# Install dependencies (if not already done)
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 🔄 What Changed

### Authentication Flow

**Before:**
- Single token (7 days)
- localStorage-only validation
- No route protection
- Weak passwords (6 chars)
- No rate limiting

**After:**
- Dual tokens (30min access + 7day refresh)
- Server-side validation
- Next.js middleware protection
- Strong passwords (12+ chars with complexity)
- Rate limiting (5 attempts per 15min)

### Breaking Changes

1. **Tokens are shorter-lived** - Users will need to log in more frequently (every 7 days max)
2. **Password requirements** - New users must use strong passwords
3. **Cookie settings** - Changed from `sameSite: 'lax'` to `'strict'`
4. **localStorage behavior** - No longer used for auth, only UI caching

### Non-Breaking Changes

- Database indexes added (performance improvement)
- Better error handling
- Security headers improved

## 🧪 Testing Checklist

After migration, test these scenarios:

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should be rate limited after 5 attempts)
- [ ] Logout clears both tokens
- [ ] Cannot access `/dashboard` without login
- [ ] Redirect to login preserves intended destination
- [ ] Token refresh works automatically
- [ ] Session expires after 7 days

### Authorization
- [ ] Non-admin cannot access `/dashboard/users`
- [ ] Admin can access all routes
- [ ] User can only see their own contracts

### Password Policy
- [ ] Cannot create user with weak password
- [ ] Password must meet all requirements
- [ ] Existing users can still login (if password meets requirements)

### Performance
- [ ] Contract list loads quickly
- [ ] Filtering by status is fast
- [ ] Searching by license plate is fast

## 🚨 Troubleshooting

### Issue: "Too many login attempts"
**Solution:** Wait 15 minutes or clear rate limit:
```bash
# This is a temporary fix - rate limits are in-memory
# Restart the dev server to clear all rate limits
```

### Issue: "Invalid password" for existing users
**Solution:** User password doesn't meet new requirements. Options:
1. Update password via admin
2. Create password reset functionality
3. Temporarily relax password requirements (not recommended)

### Issue: "Invalid token" after migration
**Solution:** Clear cookies and localStorage:
```javascript
// In browser console
localStorage.clear();
document.cookie.split(";").forEach(c => {
    document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
});
```

### Issue: Database indexes not created
**Solution:** Restart MongoDB or manually create indexes:
```bash
mongosh mongodb://dev:dev123@localhost:27018/bhhv --authSource admin

# List indexes
db.contracts.getIndexes()

# If missing, restart app to trigger index creation
# Or create manually via Mongoose connection
```

### Issue: Build errors after changes
**Solution:** Clear Next.js cache:
```bash
rm -rf .next
npm run build
```

## 📊 Performance Impact

**Expected improvements:**
- Contract queries: 50-80% faster (with indexes)
- Login attempts: Protected from brute force
- Memory: Slightly higher (rate limiting store)

**Monitoring:**
```bash
# Check MongoDB index usage
db.contracts.stats()

# Monitor query performance
db.setProfilingLevel(2)
db.system.profile.find().sort({ts:-1}).limit(10)
```

## 🔐 Production Deployment

### Additional Steps for Production

1. **Use Production Secrets:**
   ```bash
   # Generate production secrets (different from dev!)
   node scripts/generate-secrets.js
   ```

2. **Environment Variables:**
   ```bash
   # Set via hosting provider or secrets manager
   NODE_ENV=production
   JWT_SECRET=<production-secret>
   REFRESH_SECRET=<production-secret>
   ENCRYPTION_KEY=<production-key>
   ```

3. **HTTPS Required:**
   - Secure cookies only work over HTTPS
   - Configure SSL/TLS certificate

4. **Redis for Rate Limiting (Optional but Recommended):**
   ```bash
   # Install Redis client
   npm install ioredis

   # Update src/lib/rateLimit.ts to use Redis
   ```

5. **Database Indexes:**
   ```bash
   # Verify indexes are created in production
   mongosh <production-connection-string>
   db.contracts.getIndexes()
   db.users.getIndexes()
   ```

6. **Monitoring:**
   - Set up error tracking (Sentry, etc.)
   - Monitor failed login attempts
   - Alert on rate limit hits
   - Track token refresh rates

## 📞 Support

If you encounter issues during migration:

1. Check `SECURITY.md` for detailed documentation
2. Review error logs: `npm run dev` (console output)
3. Check MongoDB logs
4. Verify environment variables are set correctly
5. Test with a fresh browser session (incognito mode)

## 🎯 Next Steps (Optional Enhancements)

After successful migration, consider:

1. **Password Reset Flow** - Email-based password recovery
2. **Two-Factor Authentication** - TOTP or SMS-based 2FA
3. **Session Management UI** - Show active sessions, revoke devices
4. **Security Headers** - CSP, HSTS, X-Frame-Options
5. **CAPTCHA** - Add after N failed login attempts
6. **Audit Logging** - Track all authentication events
7. **Redis for Rate Limiting** - Scale across multiple servers