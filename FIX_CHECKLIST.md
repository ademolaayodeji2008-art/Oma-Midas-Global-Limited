# ✅ Production Fix Checklist

## 🎯 Step 1: Fix Vercel Frontend (5 minutes)

1. **Login to Vercel**
   - Go to: https://vercel.com/dashboard
   - Click on your project (omamidas or oma-midas-global-limited)

2. **Add Environment Variable**
   - Click "Settings" → "Environment Variables"
   - Click "Add New"
   - Key: `VITE_API_URL`
   - Value: `https://oma-midas-global-limited.onrender.com`
   - Select: Production ✓ Preview ✓ Development ✓
   - Click "Save"

3. **Redeploy**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Wait 2-3 minutes

4. **Verify**
   - Open https://omamidas.com.ng
   - Press F12 (DevTools)
   - Go to "Console" tab
   - Try to login
   - Check Network tab: requests should go to `https://oma-midas-global-limited.onrender.com`

---

## 🎯 Step 2: Verify Render Backend (5 minutes)

1. **Login to Render**
   - Go to: https://dashboard.render.com
   - Click on "oma-midas-global-limited" service

2. **Check Environment Variables**
   - Click "Environment" in left sidebar
   - Verify these exist:

   ```
   NODE_ENV = production
   ```

   ```
   FRONTEND_URL = https://oma-midas-global-limited.vercel.app,https://omamidas.com.ng,https://www.omamidas.com.ng
   ```

   - If missing or wrong: Edit/Add them, click "Save Changes"
   - Render will auto-redeploy (wait 2-3 minutes)

3. **Check Logs**
   - Click "Logs" tab
   - Look for: `🔒 CORS Allowed Origins:`
   - Should show 3 URLs
   - If not visible: Wait for redeploy to finish

4. **Test with Real Request**
   - Open https://omamidas.com.ng
   - Try to login
   - Check Render logs for:
     - `🌍 Request from origin: https://omamidas.com.ng`
     - `✅ Origin allowed:` (GOOD) or `❌ Origin BLOCKED:` (BAD)

---

## 🎯 Step 3: Test Core Functionality (10 minutes)

### Test 1: Login
- [ ] Go to https://omamidas.com.ng/login
- [ ] Enter member credentials
- [ ] Click "Login"
- [ ] ✅ Should redirect to dashboard (not back to login)
- [ ] ❌ If still redirects: Check browser console for errors

### Test 2: Member Balance
- [ ] On member dashboard
- [ ] Check "Cumulative Savings" card
- [ ] ✅ Should show member's personal balance (e.g., ₦50,000)
- [ ] ❌ If shows ₦365,000: Check Render logs for `[getMyFinancialSummary]` debug messages

### Test 3: Make Contribution
- [ ] Go to Contributions page
- [ ] Click "+ Make Contribution"
- [ ] Fill form and submit
- [ ] ✅ Should show success message
- [ ] ❌ If redirects to login: Check if cookie is being set

### Test 4: Cookie Persistence
- [ ] Login successfully
- [ ] Open DevTools (F12) → Application/Storage tab
- [ ] Check "Cookies" → https://omamidas.com.ng
- [ ] Look for cookie named "token"
- [ ] ✅ Should have: `Secure ✓`, `SameSite: None`
- [ ] ❌ If missing: Backend cookie settings wrong

---

## 🎯 Step 4: Database Migration (5 minutes)

**Only do this AFTER Steps 1-3 are working!**

1. **Login to Supabase**
   - Go to: https://supabase.com/dashboard
   - Click your project
   - Go to "SQL Editor"

2. **Run Migration**
   - Copy content from: `server/src/prisma/migrations/002_allow_multiple_contributions_per_month.sql`
   - Paste into SQL Editor
   - Click "Run"
   - ✅ Should say: "Success. No rows returned"

3. **Verify**
   - Test making 2 contributions in same month
   - Should work without "unique constraint" error

---

## 🎯 Step 5: Admin Add Member UI (Optional - 30 minutes)

**Backend is ready** (POST /api/admin/members already works)

**Need to create frontend UI:**
- Admin dashboard → Members page
- Add "+ Add Member" button
- Modal/form with fields: name, email, phone, password
- Submit to POST /api/admin/members

---

## 🚨 If Still Having Issues

### Issue: CORS errors persist
**Check:**
1. Render logs show correct FRONTEND_URL?
2. Vercel env vars saved and redeployed?
3. Browser is hitting correct backend URL?
4. Try incognito/private window (cache issue)

### Issue: Balance still shows ₦365,000
**Check:**
1. Dashboard.jsx is calling `/api/member/financial-summary`?
2. Render logs show userId in debug messages?
3. Cookie is being sent with request?
4. Check Network tab: request headers include `Cookie: token=...`

### Issue: Login still redirects back
**Check:**
1. Backend logs show successful login?
2. Cookie is being set in response?
3. Response headers: `Set-Cookie: token=...; Secure; SameSite=None`
4. Frontend is on HTTPS (required for Secure cookies)

---

## ✅ Success Criteria

When everything works:
- ✅ Members can login without redirect loop
- ✅ Members see their personal balance (not company total)
- ✅ Members can make multiple contributions per month
- ✅ Admin can add new members directly
- ✅ No CORS errors in browser console
- ✅ Cookie persists across page reloads
