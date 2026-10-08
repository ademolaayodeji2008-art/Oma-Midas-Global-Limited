# Implementation Plan — Oma Midas Global Limited

> Full-stack savings & loan cooperative web app.
> Workspace root: `c:\Users\USER\Desktop\Oma Midas Global Limited`
> This plan is decomposed into 4 sequential FEATs. See `.agents/tasks/oma-midas-fullstack/` for full FEAT artifacts.

---

## FEAT-001 — Project Scaffolding, Config & Database

- [ ] 1. Create `server/package.json` (ES module, dependencies: express@4.18.2, @prisma/client@5.14.0, bcryptjs@2.4.3, jsonwebtoken@9.0.2, cookie-parser@1.4.6, cors@2.8.5, dotenv@16.4.5, zod@3.23.8, nodemailer@6.9.14, node-cron@3.0.3, express-rate-limit@7.3.1, helmet@7.1.0, morgan@1.10.0, uuid@10.0.0, axios@1.7.2; devDeps: prisma@5.14.0, nodemon@3.1.4). Add `"prisma":{"schema":"src/prisma/schema.prisma"}`.
      Files: `server/package.json`
      Verify: `cd server && npm install` — exits 0.

- [ ] 2. Create `server/.env.example` with all required variables (PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY, FRONTEND_URL, EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM, NODE_ENV, SENTRY_DSN).
      Files: `server/.env.example`
      Verify: File exists and contains all variable names.

- [ ] 3. Create `server/src/prisma/schema.prisma` with all 9 models (User, Cycle, Contribution, Loan, LoanInstallment, Refund, LedgerEntry, Notification, AuditLog, Setting) and all 9 enums (Role, UserStatus, MemberType, ContributionStatus, LoanStatus, InstallmentStatus, RefundStatus, LedgerType, LedgerBook). Add passwordResetToken/passwordResetExpires fields to User.
      Files: `server/src/prisma/schema.prisma`
      Verify: `cd server && npx prisma generate` — exits 0.

- [ ] 4. Create `server/src/prisma/seed.js` — upserts admin user (admin@omamidas.com / Admin@Midas2024!), all settings rows (fee_percentage=30, loan_multiplier=3, min_consecutive_months=3, monthly_contribution_kobo=500000, terms_and_conditions=HTML), and an active cycle (Oct 1 2024 – Sep 30 2025).
      Files: `server/src/prisma/seed.js`
      Verify: `cd server && node src/prisma/seed.js` — logs "Seed complete".

- [ ] 5. Create `server/src/utils/kobo.js` (koboToNaira, nairaToKobo, formatNaira, calculateLoanBreakdown), `server/src/utils/token.js` (generateToken, verifyToken, generateResetToken, hashResetToken), `server/src/utils/logger.js` (timestamped logger with optional Sentry), `server/src/utils/cycleHelpers.js` (getActiveCycle, getMemberSavingsInCycle, getConsecutivePaidMonths).
      Files: `server/src/utils/kobo.js`, `server/src/utils/token.js`, `server/src/utils/logger.js`, `server/src/utils/cycleHelpers.js`
      Verify: `cd server && node -e "import('./src/utils/kobo.js').then(m=>console.log(m.formatNaira(100000)))"` — prints ₦1,000.00.

- [ ] 6. Create `client/package.json` (react@18.3.1, react-dom@18.3.1, react-router-dom@6.24.0, framer-motion@11.2.12, axios@1.7.2; devDeps: vite@5.3.1, @vitejs/plugin-react@4.3.1, tailwindcss@3.4.4, postcss@8.4.39, autoprefixer@10.4.19).
      Files: `client/package.json`
      Verify: `cd client && npm install` — exits 0.

- [ ] 7. Create `client/.env.example`, `client/vite.config.js` (React plugin + /api proxy), `client/tailwind.config.js` (all design tokens: primary #4A1D4F, accent #C9A86A, blush #F4E1E6, background #FAF7F5, charcoal #2B2B2B, success #2E7D5B, warning #D9962B, error #B3392F; fonts: Playfair Display, Inter), `client/postcss.config.js`.
      Files: `client/.env.example`, `client/vite.config.js`, `client/tailwind.config.js`, `client/postcss.config.js`
      Verify: Config files exist and are syntactically valid JS.

- [ ] 8. Create `client/index.html` (Google Fonts for Playfair Display + Inter, div#root, script src=/src/main.jsx), `client/public/logo.svg` (80×80 SVG: plum circle, gold "OM" monogram, gold crown path), `client/public/favicon.svg` (32×32 version).
      Files: `client/index.html`, `client/public/logo.svg`, `client/public/favicon.svg`
      Verify: SVG files open without errors.

- [ ] 9. Create `client/src/styles/index.css` (@tailwind directives, CSS custom properties for all design tokens, .card-base, .btn-primary, .gold-divider utility classes, prefers-reduced-motion media query). Create minimal stubs `client/src/main.jsx` and `client/src/App.jsx` (returns <div/>) so Vite build works.
      Files: `client/src/styles/index.css`, `client/src/main.jsx`, `client/src/App.jsx`
      Verify: `cd client && npm run build` — exits 0.

---

## FEAT-002 — Complete Express Backend

- [ ] 10. Create all 5 middleware files: `auth.middleware.js` (JWT from httpOnly cookie → attach req.user), `adminOnly.middleware.js` (role check), `validate.middleware.js` (Zod schema validation), `rateLimiter.middleware.js` (authLimiter: 10/15min, generalLimiter: 60/min), `errorHandler.middleware.js` (structured error responses, Prisma error mapping).
       Files: `server/src/middleware/{auth,adminOnly,validate,rateLimiter,errorHandler}.middleware.js`
       Verify: Files exist and import without syntax errors.

- [ ] 11. Create `server/src/services/paystack.service.js` — all 8 Paystack API functions (initializeTransaction, verifyTransaction, resolveAccountNumber, listBanks, createTransferRecipient, initiateTransfer, fetchTransfer, getBalance) using axios with Authorization header from env.
       Files: `server/src/services/paystack.service.js`
       Verify: Importing the module does not throw.

- [ ] 12. Create `server/src/services/ledger.service.js` (getCurrentBalance, appendLedgerEntry — accepts Prisma transaction client), `server/src/services/email.service.js` (all 9 email functions with branded HTML templates), `server/src/services/notification.service.js` (createNotification, markNotificationsRead, getUnreadCount).
       Files: `server/src/services/ledger.service.js`, `server/src/services/email.service.js`, `server/src/services/notification.service.js`
       Verify: All files import without errors.

- [ ] 13. Create `server/src/controllers/auth.controller.js` — register, login (JWT cookie, status checks), logout, me, forgotPassword (UUID token, email link), resetPassword (hash verify, expiry check).
       Files: `server/src/controllers/auth.controller.js`
       Verify: Controller imports without errors.

- [ ] 14. Create `server/src/routes/auth.routes.js` — POST /register (validate + authLimiter), POST /login (validate + authLimiter), POST /logout, GET /me, POST /forgot-password, POST /reset-password, PUT /profile (authenticate), PUT /change-password (authenticate).
       Files: `server/src/routes/auth.routes.js`
       Verify: Route file imports without errors.

- [ ] 15. Create `server/src/controllers/contributions.controller.js` (getMyContributions, getContributionStatus, initializePayment, getConsistentStreak, getMonthlyAmount) and `server/src/routes/contributions.routes.js`.
       Files: `server/src/controllers/contributions.controller.js`, `server/src/routes/contributions.routes.js`
       Verify: Import without errors.

- [ ] 16. Create `server/src/controllers/loans.controller.js` (checkEligibility with all rules: ACTIVE status, consecutive months, no existing active loan, fund sufficiency, max 3× savings; requestLoan with breakdown + installment validation; getMyLoans; getMyCurrentLoan; initializeLoanRepayment) and `server/src/routes/loans.routes.js`.
       Files: `server/src/controllers/loans.controller.js`, `server/src/routes/loans.routes.js`
       Verify: Import without errors.

- [ ] 17. Create `server/src/controllers/refunds.controller.js` (requestRefund: block if outstanding loan, create PENDING refund; getMyRefunds) and `server/src/routes/refunds.routes.js`.
       Files: `server/src/controllers/refunds.controller.js`, `server/src/routes/refunds.routes.js`
       Verify: Import without errors.

- [ ] 18. Create `server/src/controllers/notifications.controller.js` (getNotifications paginated, markRead, getUnreadCount) and `server/src/routes/notifications.routes.js`. Create `server/src/routes/cycle.routes.js` (GET / → active cycle, public).
       Files: `server/src/controllers/notifications.controller.js`, `server/src/routes/notifications.routes.js`, `server/src/routes/cycle.routes.js`
       Verify: Import without errors.

- [ ] 19. Create `server/src/controllers/paystack.controller.js` — webhook handler (HMAC-SHA512 signature verification, handle charge.success for contributions + installments, transfer.success/failed/reversed for loans + refunds, all in $transaction with ledger entries + notifications) and resolveAccount + listBanks handlers. Create `server/src/routes/paystack.routes.js` (POST /webhook with express.raw, GET /resolve-account with authenticate, GET /banks public).
       Files: `server/src/controllers/paystack.controller.js`, `server/src/routes/paystack.routes.js`
       Verify: Import without errors.

- [ ] 20. Create `server/src/controllers/admin.controller.js` — all admin functions: getDashboardStats, getPendingMembers, approveMember (email + notification + audit), rejectMember, getAllMembers, getMemberDetail, deactivateMember, getLoanRequests, approveLoan (Paystack Transfer + ledger), rejectLoan, getRefundRequests, approveRefund, rejectRefund, getCompanyFundBalance, recordFundTopup, getAllTransactions (with CSV export), getAuditLogs, getSettings, updateSetting, startNewCycle. All log to AuditLog. Create `server/src/routes/admin.routes.js`.
       Files: `server/src/controllers/admin.controller.js`, `server/src/routes/admin.routes.js`
       Verify: Import without errors.

- [ ] 21. Create `server/src/jobs/reconciliation.job.js` (startReconciliationJob: hourly + on startup, checks all PENDING contributions/installments via verifyTransaction, all APPROVED loans/refunds via fetchTransfer, updates DB + ledger idempotently), `server/src/jobs/reminder.job.js` (daily 9am: contribution + installment reminders, dedup by date, mark overdue), `server/src/jobs/keepalive.job.js` (daily 3am: SELECT 1 ping).
       Files: `server/src/jobs/reconciliation.job.js`, `server/src/jobs/reminder.job.js`, `server/src/jobs/keepalive.job.js`
       Verify: All three files import without errors.

- [ ] 22. Create `server/server.js` — full entry point: helmet, cors (FRONTEND_URL only, credentials:true), express.json with rawBody capture for webhook, cookieParser, morgan, mount all 8 route groups (/api/auth, /api/contributions, /api/loans, /api/refunds, /api/admin, /api/paystack, /api/notifications, /api/cycle), GET /health, global errorHandler, start 3 cron jobs, app.listen(PORT) with DB ping on startup.
       Files: `server/server.js`
       Verify: `cd server && npm run dev` — logs "Server running on port 5000", `curl http://localhost:5000/health` returns {status:"ok"}.

---

## FEAT-003 — Complete React Frontend

- [ ] 23. Create `client/src/lib/api.js` (axios instance, baseURL from VITE_API_URL, withCredentials:true, 401 interceptor → /login) and `client/src/lib/paystack.js` (loadPaystack, openPaystackCheckout).
       Files: `client/src/lib/api.js`, `client/src/lib/paystack.js`
       Verify: Vite build includes files without error.

- [ ] 24. Create `client/src/context/AuthContext.jsx` (user state, hydrate from /api/auth/me, login/logout/isAdmin/isMember/isAuthenticated, useAuth hook export) and `client/src/hooks/useAuth.js` (re-export), `client/src/hooks/useNotifications.js` (fetch + poll unread), `client/src/hooks/useCycle.js` (fetch active cycle).
       Files: `client/src/context/AuthContext.jsx`, `client/src/hooks/useAuth.js`, `client/src/hooks/useNotifications.js`, `client/src/hooks/useCycle.js`
       Verify: `npm run build` — exits 0.

- [ ] 25. Create all 10 UI components: `Button.jsx` (variants + Framer Motion hover/tap), `Card.jsx`, `Badge.jsx` (5 variants), `Modal.jsx` (AnimatePresence fade+scale, focus trap, Escape/overlay close), `Table.jsx` (columns config, loading skeleton), `Pagination.jsx`, `Toast.jsx` (ToastProvider + useToast hook, slide-in), `NotificationBell.jsx`, `AnimatedCounter.jsx` (spring animation 0→value), `ProgressBar.jsx` (width animation on mount).
       Files: `client/src/components/ui/{Button,Card,Badge,Modal,Table,Pagination,Toast,NotificationBell,AnimatedCounter,ProgressBar}.jsx`
       Verify: `npm run build` — exits 0.

- [ ] 26. Create 4 layout components: `Navbar.jsx` (sticky, scroll shadow, public pages), `Sidebar.jsx` (240px fixed desktop, role-aware links, framer-motion slide), `MobileMenu.jsx` (bottom tab bar on mobile), `Footer.jsx` (public pages).
       Files: `client/src/components/layout/{Navbar,Sidebar,MobileMenu,Footer}.jsx`
       Verify: `npm run build` — exits 0.

- [ ] 27. Create 4 form components: `TermsModal.jsx` (scroll-to-bottom requirement before enabling checkbox), `BankAccountVerifier.jsx` (bank select + account number → calls /api/paystack/resolve-account on blur), `LoanCalculator.jsx` (live 70%/30% breakdown display), `RepaymentPlanBuilder.jsx` (N rows of date+amount, validates sum === total, all dates ≤ cycle end).
       Files: `client/src/components/forms/{TermsModal,BankAccountVerifier,LoanCalculator,RepaymentPlanBuilder}.jsx`
       Verify: `npm run build` — exits 0.

- [ ] 28. Create `client/src/components/layout/PageTransition.jsx` (motion.div fade+slide wrapper) to be used in App.jsx inside AnimatePresence.
       Files: `client/src/components/layout/PageTransition.jsx`
       Verify: `npm run build` — exits 0.

- [ ] 29. Create all 7 public pages: `Landing.jsx` (Hero + How It Works + Benefits + LoanCalculator section + FAQ accordion + CTA + Footer, all with Framer Motion scroll animations), `Login.jsx`, `Signup.jsx` (BankAccountVerifier + TermsModal), `ForgotPassword.jsx`, `ResetPassword.jsx` (reads ?token=), `PendingApproval.jsx`, `Rejected.jsx` (reads ?reason=).
       Files: `client/src/pages/public/{Landing,Login,Signup,ForgotPassword,ResetPassword,PendingApproval,Rejected}.jsx`
       Verify: `npm run build` — exits 0.

- [ ] 30. Create all 8 member pages, each using Sidebar + Framer Motion animations: `Dashboard.jsx` (AnimatedCounter stats, 12-month contribution grid, loan summary card), `Contributions.jsx` (month list, Pay Now → Paystack, streak display), `LoanRequest.jsx` (eligibility banner + LoanCalculator + RepaymentPlanBuilder), `LoanRepayment.jsx` (installment table with overdue highlighting + Pay), `Refund.jsx` (savings balance, block if loan outstanding), `Transactions.jsx` (filterable table, CSV export), `Profile.jsx` (edit phone/bank/password), `Notifications.jsx` (paginated, mark read).
       Files: `client/src/pages/member/{Dashboard,Contributions,LoanRequest,LoanRepayment,Refund,Transactions,Profile,Notifications}.jsx`
       Verify: `npm run build` — exits 0.

- [ ] 31. Create all 8 admin pages, each using Sidebar + Framer Motion: `Dashboard.jsx` (AnimatedCounter stats + SVG charts), `Members.jsx` (pending approvals tab + all members tab with approve/reject/deactivate), `Loans.jsx` (loan requests with expandable installment schedule, approve/reject), `Refunds.jsx` (approve/reject), `CompanyFund.jsx` (fund balance, topup modal, ledger table), `Reports.jsx` (full ledger with filters + CSV), `AuditLog.jsx` (paginated admin actions), `Settings.jsx` (system settings + T&C editor + Start New Cycle).
       Files: `client/src/pages/admin/{Dashboard,Members,Loans,Refunds,CompanyFund,Reports,AuditLog,Settings}.jsx`
       Verify: `npm run build` — exits 0.

- [ ] 32. Replace `client/src/App.jsx` with full React Router v6 setup: all public routes, protected member routes (require ACTIVE status), protected admin routes (require ADMIN role), ProtectedRoute component, AuthProvider + ToastProvider wrappers, AnimatePresence for page transitions. Replace `client/src/main.jsx` with full entry point.
       Files: `client/src/App.jsx`, `client/src/main.jsx`
       Verify: `npm run build` — exits 0. `npm run dev` — app loads at localhost:5173.

---

## FEAT-004 — Deployment Configs & README

- [ ] 33. Create `server/render.yaml` (Render web service: plan starter, buildCommand `npm install && npx prisma generate && npx prisma migrate deploy`, startCommand `node server.js`, healthCheckPath /health, all env vars listed).
       Files: `server/render.yaml`
       Verify: File is valid YAML.

- [ ] 34. Create `client/vercel.json` ({rewrites: [{source: "/(.*)", destination: "/index.html"}]} for SPA routing + build config).
       Files: `client/vercel.json`
       Verify: File is valid JSON.

- [ ] 35. Create `server/scripts/backup.js` (pg_dump to server/backups/backup-YYYY-MM-DD.sql, exits gracefully if DATABASE_URL not set). Add `"backup":"node scripts/backup.js"` to server/package.json scripts.
       Files: `server/scripts/backup.js`, `server/package.json` (scripts update)
       Verify: `cd server && node scripts/backup.js` — exits with clear message (success if DB available, graceful error if not).

- [ ] 36. Create root `README.md` covering: project overview, architecture ASCII diagram, prerequisites, local dev setup steps, default admin credentials, all env vars table, Paystack webhook configuration, test payment instructions, Render deployment guide, Vercel deployment guide, Supabase setup, go-live checklist, backup/restore instructions, security notes, money handling notes, cooperative business rules.
       Files: `README.md`
       Verify: File exists with all sections present.
