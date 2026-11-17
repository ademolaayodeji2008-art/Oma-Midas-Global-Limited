# 🔥 URGENT: Fix CORS and Environment Variables

## Problem
CORS error "Not allowed by CORS" blocking API calls. Two issues found:
1. Render backend environment variables may not match `.env` file
2. Vercel frontend may not have production API URL configured

---

## PART A: Fix Vercel Frontend (Do This FIRST)

### Step 1: Go to Vercel Dashboard
1. Login to https://vercel.com/dashboard
2. Click on your frontend project: "oma-midas-global-limited" or "omamidas"
3. Click "Settings" tab
4. Click "Environment Variables" in the left sidebar

### Step 2: Add Production API URL

**Add this variable** (if it doesn't exist):

**Key:** `VITE_API_URL`  
**Value:** `https://oma-midas-global-limited.onrender.com`

**Important:**
- NO `/api` at the end
- Select all environments: Production, Preview, Development
- Click "Save"

### Step 3: Redeploy
1. Go to "Deployments" tab
2. Click "..." on the latest deployment
3. Click "Redeploy"
4. Wait 1-2 minutes for deployment to complete

---

## PART B: Fix Render Backend

### Step 1: Go to Render Dashboard
1. Login to https://dashboard.render.com
2. Click on your backend service: "oma-midas-global-limited"
3. Click "Environment" tab in the left sidebar

### Step 2: Verify/Add These Variables

**MUST HAVE** (copy-paste exactly as shown):

```
NODE_ENV=production
```

```
FRONTEND_URL=https://oma-midas-global-limited.vercel.app,https://omamidas.com.ng,https://www.omamidas.com.ng
```

```
JWT_SECRET=04c8d8e6ea279815a9c8d5165b4a496ffb34ddc170e2b0c8a8a5c8acefc70e566d9bb31ecca11d340b74249859f00e5864b254597ed57953c756d3ddf85101ca
```

```
JWT_EXPIRES_IN=7d
```

```
DATABASE_URL=postgresql://postgres.vbdauapbmieoyclehwsn:AdeAyo2008..@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=60&pool_timeout=60&connection_limit=3
```

```
DIRECT_URL=postgresql://postgres.vbdauapbmieoyclehwsn:AdeAyo2008..@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=30
```

```
EMAIL_HOST=smtp.gmail.com
```

```
EMAIL_PORT=465
```

```
EMAIL_USER=dellerbusiness02@gmail.com
```

```
EMAIL_PASS=awpbeenavovogdky
```

```
EMAIL_FROM=Oma Midas <noreply@omamidas.com>
```

### Step 3: After Adding/Updating
1. Click "Save Changes" at the bottom
2. Render will automatically redeploy (wait 2-3 minutes)
3. Check the logs for the CORS debug messages

## Expected Log Output (After Fix)

When the fix is working, you should see in Render logs:

```
🔒 CORS Allowed Origins: [
  'https://oma-midas-global-limited.vercel.app',
  'https://omamidas.com.ng',
  'https://www.omamidas.com.ng'
]
🌍 Request from origin: https://omamidas.com.ng
✅ Origin allowed: https://omamidas.com.ng
```

## If Still Getting CORS Errors

Check the logs to see which origin is being blocked:
- If you see: `❌ Origin BLOCKED: https://omamidas.com.ng`
- And it's NOT in the allowed list, then Render didn't pick up the env var change
- Try deleting and re-adding the FRONTEND_URL variable

## Testing After Deployment

1. Open https://omamidas.com.ng in browser
2. Open DevTools (F12) → Network tab
3. Try to login
4. Check:
   - Response headers should include: `Access-Control-Allow-Origin: https://omamidas.com.ng`
   - Response headers should include: `Access-Control-Allow-Credentials: true`
   - Cookie should be set with `Secure; SameSite=None`

## If Members Still See Wrong Balance

After CORS is fixed, check Render logs for these debug messages:
```
🔍 [getMyContributions] userId: <uuid>
🔍 [getMyContributions] Found X contributions
```

If userId is showing as undefined, then authentication cookie is still not working.

## Next Steps After CORS Fix

1. ✅ Test member login
2. ✅ Test member balance display (should show personal balance, not ₦365,000)
3. ✅ Test member contribution (should work without redirect)
4. ✅ Run database migration: `002_allow_multiple_contributions_per_month.sql`
5. ✅ Create admin UI for adding members directly
