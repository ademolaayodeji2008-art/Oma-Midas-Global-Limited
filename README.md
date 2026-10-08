# Oma Midas Global Limited — Savings & Loan Cooperative Platform

A full-stack web platform for managing a cooperative savings and loan society. Members make monthly contributions, build savings, and apply for loans within a structured 12-month cycle. Administrators manage the fund, approve loans, process disbursements, and track all financial activity.

---

## Project Overview

Oma Midas Global Limited is a cooperative savings and loan platform with two distinct portals:

- **Member portal** — register, pay monthly contributions via Paystack, view savings balance, apply for loans, track repayments, and receive in-app and email notifications.
- **Admin portal** — manage members and roles, configure cooperative settings, approve or reject loan applications, trigger disbursements, view the full financial ledger, and download reports.

### Cooperative model

- Cycles run from **October 1 to September 30** each year.
- Members make fixed monthly contributions (default ₦5,000; configurable in admin settings).
- Contributions build a **savings fund** and a **loan fund**.
- Members can borrow up to 3× their total savings in the current cycle.
- A 30% loan fee is retained in the company fund; the member receives 70% of the requested amount.
- The member repays 100% of the requested amount (no additional interest beyond the fee).
- **NEW** members must complete 3 consecutive paid months before becoming loan-eligible; **EXISTING** members are eligible immediately.

---

## Architecture

```
┌─────────────┐        HTTPS         ┌───────────────────────┐
│   Browser   │ ──────────────────►  │  Vercel (React SPA)   │
└─────────────┘                       └──────────┬────────────┘
                                                  │  REST API (HTTPS)
                                      ┌───────────▼────────────┐
                                      │  Render (Express API)  │
                                      │  Node.js / Prisma ORM  │
                                      └───┬───────────┬────────┘
                                          │           │
                       ┌──────────────────▼──┐   ┌───▼──────────────────┐
                       │ Supabase (Postgres)  │   │  Paystack APIs       │
                       │ Prisma migrations    │   │  Payments/Transfers  │
                       └─────────────────────┘   └──────────────────────┘
                                                         │
                                      ┌──────────────────▼──┐
                                      │  Nodemailer → SMTP  │
                                      │  (Gmail / SendGrid) │
                                      └─────────────────────┘
```

---

## Prerequisites

| Requirement | Version / Notes |
|---|---|
| Node.js | 18 or higher |
| npm | 9 or higher |
| PostgreSQL client (`pg_dump`, `psql`) | For local backups and restores |
| Supabase account | Free tier works; Pro recommended for production |
| Paystack account | Business account required for Transfers (payouts) |
| SMTP email account | Gmail with App Password, or SendGrid, etc. |

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd oma-midas-global-limited
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Configure server environment

```bash
cp .env.example .env
```

Open `server/.env` and fill in all values. See the [Environment Variables Reference](#environment-variables-reference) section below.

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Seed the database

```bash
node src/prisma/seed.js
```

This creates the default admin account and initial cooperative settings.

### 6. Start the backend

```bash
npm run dev
```

The Express API starts on **http://localhost:5000**. The `/health` endpoint confirms the server and database are up.

### 7. Install frontend dependencies (new terminal)

```bash
cd client
npm install
```

### 8. Configure frontend environment

```bash
cp .env.example .env
```

Set `VITE_API_URL=http://localhost:5000/api` and `VITE_PAYSTACK_PUBLIC_KEY=pk_test_...`.

### 9. Start the frontend

```bash
npm run dev
```

The React app starts on **http://localhost:5173**.

---

## Default Admin Credentials

| Field | Value |
|---|---|
| Email | `admin@omamidas.com` |
| Password | `Admin@Midas2024!` |

> **CHANGE THIS PASSWORD BEFORE GOING LIVE.** See the Go-Live Checklist.

---

## Environment Variables Reference

### Server (`server/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | TCP port the Express server listens on | `5000` |
| `DATABASE_URL` | Supabase / PostgreSQL connection string | `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres` |
| `JWT_SECRET` | Long random string (64+ chars) used to sign JWTs | `a_very_long_random_secret_string_here` |
| `JWT_EXPIRES_IN` | JWT token lifetime | `7d` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key — use `sk_test_` in dev, `sk_live_` in prod | `sk_test_xxxxxxxxxxxxxxxx` |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key — use `pk_test_` in dev, `pk_live_` in prod | `pk_test_xxxxxxxxxxxxxxxx` |
| `FRONTEND_URL` | Exact origin of the React frontend (no trailing slash) — used for CORS | `http://localhost:5173` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username / email address | `your@email.com` |
| `EMAIL_PASS` | SMTP password or app password | `your_app_password` |
| `EMAIL_FROM` | From address in RFC 5321 format | `Oma Midas <noreply@omamidas.com>` |
| `NODE_ENV` | Runtime environment: `development`, `production`, or `test` | `development` |
| `SENTRY_DSN` | Sentry project DSN for error monitoring (leave blank to disable) | `https://xxx@yyy.ingest.sentry.io/zzz` |
| `ENABLE_BACKUP_CRON` | Set to `true` to enable weekly Sunday 2am backup cron | `true` |

### Client (`client/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the Express API (no trailing slash) | `http://localhost:5000/api` |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key (safe to expose in browser) | `pk_test_xxxxxxxxxxxxxxxx` |

---

## Paystack Configuration

### Webhook URL

```
https://your-backend-domain.onrender.com/api/paystack/webhook
```

Register this in the Paystack dashboard: **Settings → API Keys & Webhooks → Webhook URL**.

The backend verifies every incoming webhook using HMAC-SHA512 with your `PAYSTACK_SECRET_KEY`. Requests with an invalid or missing `x-paystack-signature` header are rejected with 401.

### Events to enable

| Event | Purpose |
|---|---|
| `charge.success` | Member contribution or loan repayment received |
| `transfer.success` | Loan disbursement to member succeeded |
| `transfer.failed` | Loan disbursement failed — member's balance is reversed |
| `transfer.reversed` | Transfer reversal confirmed |

### Test credentials

**Test card:**
- Number: `4084 0840 8408 4081`
- Expiry: any future date
- CVV: `408`

**Test bank transfer:** Use the test bank details from [Paystack's test documentation](https://paystack.com/docs/payments/test-payments/).

---

## Deployment Guide

### Backend (Render)

1. Push the repository to GitHub.
2. In the [Render dashboard](https://render.com), create a new **Web Service**.
3. Connect the GitHub repo and set the **Root Directory** to `server/`.
4. Render reads `server/render.yaml` for the build and start commands automatically.
5. In the **Environment** tab, add all server environment variables (see the table above).
6. After the first deploy, visit `https://your-app.onrender.com/health` — it should return `200 OK` with a JSON status.

> The `render.yaml` configures: Node runtime, Oregon region, Starter plan, `npm install && npx prisma generate && npx prisma migrate deploy` for build, and `node server.js` for start.

### Frontend (Vercel)

1. In the [Vercel dashboard](https://vercel.com), import the GitHub repository.
2. Set the **Root Directory** to `client/`.
3. Add environment variables:
   - `VITE_API_URL` = `https://your-backend.onrender.com/api`
   - `VITE_PAYSTACK_PUBLIC_KEY` = `pk_live_...`
4. Deploy. Vercel auto-detects Vite and uses the `client/vercel.json` rewrite rule to serve `index.html` for all routes (required for React Router).

### Database (Supabase)

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **Settings → Database → Connection string** and copy the **URI** (Transaction mode, port 6543 for connection pooling).
3. Set this URI as `DATABASE_URL` in both `server/.env` and the Render environment variables.
4. On first deploy, Prisma runs `npx prisma migrate deploy` as part of the build command.

---

## Go-Live Checklist

Copy this checklist into a tracking issue and tick each item before accepting real payments.

- [ ] All environment variables set in the Render dashboard (no placeholder values)
- [ ] All environment variables set in the Vercel dashboard
- [ ] `NODE_ENV=production` set on Render
- [ ] Paystack **live** keys configured (replace every `sk_test_` / `pk_test_` with `sk_live_` / `pk_live_`)
- [ ] Paystack webhook URL registered and pointing to the Render backend
- [ ] Paystack webhook events enabled: `charge.success`, `transfer.success`, `transfer.failed`, `transfer.reversed`
- [ ] Paystack business verification completed (required to initiate Transfers / payouts)
- [ ] Paystack balance funded before first payout is triggered
- [ ] Run a small real test payment (₦100) end-to-end and confirm it appears in the ledger
- [ ] Run a small real test payout and confirm it reaches the test bank account
- [ ] Admin password changed from the default `Admin@Midas2024!`
- [ ] `JWT_SECRET` is a strong random secret (32+ characters, generated with `openssl rand -hex 64`)
- [ ] CORS `FRONTEND_URL` set to the production Vercel domain only
- [ ] SMTP credentials verified — send a test email and confirm delivery
- [ ] Supabase connection string uses Transaction mode (port 6543) for Prisma
- [ ] `/health` endpoint returns `200 OK` with `"db":"ok"` after production deploy
- [ ] Database migrations applied (`npx prisma migrate deploy` — done automatically by Render build)
- [ ] Seed script run (admin account and settings exist in the database)
- [ ] Active cooperative cycle created for the current year (Oct 1 – Sep 30) in admin settings
- [ ] Sentry DSN configured and a test error confirmed in the Sentry dashboard (optional but recommended)
- [ ] Backup script tested: `cd server && npm run backup` completes without error

---

## Backup & Restore

### Create a manual backup

```bash
cd server
npm run backup
# or: node scripts/backup.js
```

Backup files are saved to `server/backups/backup-YYYY-MM-DD-HH-mm.sql`.

### Schedule automatic weekly backups

Set `ENABLE_BACKUP_CRON=true` in `server/.env` (and in the Render environment variables) to run a weekly backup cron job every **Sunday at 2:00 AM**.

In `server.js`, add:

```js
if (process.env.ENABLE_BACKUP_CRON === 'true') {
  const { startBackupCronJob } = await import('./scripts/backup.cron.js');
  startBackupCronJob();
}
```

### Restore from a backup

```bash
psql YOUR_DATABASE_URL < server/backups/backup-2025-01-12-02-00.sql
```

> **WARNING:** This will overwrite **all data** in the target database. Always confirm the connection string points to the correct database before restoring.

### Supabase Pro daily backups

If your Supabase project is on the **Pro plan**, Supabase automatically takes daily point-in-time backups. The `pg_dump` script above provides an additional weekly snapshot for redundancy. On the **Free plan**, this script is your only automated backup.

---

## Security Notes

- **JWT tokens** are stored in `httpOnly`, `secure`, `SameSite=strict` cookies — not in `localStorage`.
- **CORS** is restricted to the exact origin set in `FRONTEND_URL`. No wildcard origins in production.
- **Admin routes** verify the `ADMIN` role server-side on every request; the frontend role check is for UX only.
- **Paystack webhooks** are verified using HMAC-SHA512 before any state is changed.
- **Rate limiting** is applied to all authentication endpoints (10 requests per 15 minutes per IP).
- **Input validation** uses Zod schemas on all API endpoints.
- **Passwords** are hashed with bcrypt at cost factor 12.
- **Never log** secrets, JWTs, or full card or bank account details.
- **Secrets rotation:** rotate `JWT_SECRET` and Paystack keys immediately if they are ever exposed.

---

## Money Handling

All monetary values are stored and calculated in **kobo** (the smallest Nigerian currency unit, where 1 NGN = 100 kobo) as **integers**. Floating-point arithmetic is never used for money calculations.

The `kobo.js` utility provides safe conversion functions:

```js
toKobo(5000)     // ₦5,000 → 500000 kobo
fromKobo(500000) // 500000 kobo → ₦5,000
formatNaira(500000) // → "₦5,000.00"
```

---

## Cooperative Business Rules

| Rule | Detail |
|---|---|
| Cycle period | October 1 to September 30 |
| Monthly contribution | Set in admin settings (`monthly_contribution_kobo`); default ₦5,000 (500,000 kobo) |
| Loan eligibility — NEW members | Must complete 3 consecutive paid months |
| Loan eligibility — EXISTING members | Eligible immediately |
| Maximum loan amount | 3× the member's total savings in the current cycle |
| Loan fee | 30% of the requested amount, retained in the company fund |
| Amount disbursed to member | 70% of the requested amount |
| Total repayable by member | 100% of the requested amount (no additional interest) |
| Refund eligibility | Blocked if the member has any outstanding loan balance |

---

## Contributing

This is an internal project. Contact the project maintainer for repository access.
