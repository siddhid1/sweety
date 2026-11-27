# Sweety – Blood Glucose Tracker

A full-stack web application that helps diabetes patients securely record, manage, and monitor
their daily blood glucose readings — up to four readings per day across four time slots
(Morning fasting, After breakfast, After lunch, After dinner) — with daily and monthly reports.

Built for the **Kenpath Junior Full Stack Developer (JavaScript & AI)** assignment
(MERN + PostgreSQL stack).

## Problem Statement

Patients need a simple, reliable way to log blood sugar values (mg/dl), review the day at a
glance, and look back at trends across the month. Sweety provides JWT-authenticated,
per-user CRUD for readings with strict business validations enforced on both frontend and
backend (authoritative), plus daily / month-to-date / previous-month reports.

## Features

- **Authentication** — register, login, persisted session, logout; bcrypt-hashed passwords; JWT.
- **Readings CRUD** — add / view / edit / delete your own readings only; date picker, slot
  dropdown, value input; sorted by date (desc) then slot order; paginated list (`?page&limit`).
- **Business validations (frontend + backend)** with exact required messages:
  - Empty value → `Please enter a glucose value.`
  - Not a whole number in 40–600 → `Value must be between 40 and 600 mg/dl.`
  - Duplicate slot on a date → `You already have an After lunch reading for this date.`
    (+ PostgreSQL `UNIQUE(user_id, reading_date, time_slot)`)
  - More than 4 readings/day → `You can add only 4 readings per day.`
  - Future date → `Date cannot be in the future.`
- **Reports** — highest / lowest / average (1 decimal) / count + date range, for:
  Daily (selected date), Month-to-date (1st → selected date), Previous month
  (full prior calendar month, leap/year-boundary safe). Friendly empty state, user-isolated.
- **Dashboard** — welcome message, selected date, 4 stat cards, quick add-reading form,
  daily readings list with range color badges (low / in-range / elevated).
- **Reports page** — three tabs + reference-date picker + Recharts glucose trend line.

## Technology Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19, Vite, JavaScript (ES6+), Tailwind CSS, React Router DOM, Axios, Recharts |
| Backend  | Node.js, Express.js, JWT, bcryptjs, Prisma ORM |
| Database | PostgreSQL 18 |
| Testing  | Jest, Supertest (21 backend tests) |
| Tools    | Docker Compose (Postgres), ESLint-ready, Postman-friendly REST |

## Project Architecture

```
.
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Navbar, ProtectedRoute, StatCard, ReadingForm, EmptyState
│   │   ├── pages/           # Login, Register, Dashboard, Readings, Reports
│   │   ├── context/         # AuthContext (token persistence, /me restore)
│   │   ├── services/        # api.js (Axios instance + interceptors + slot helpers)
│   │   ├── App.jsx main.jsx index.css
│   └── package.json
├── server/                  # Express API
│   ├── prisma/
│   │   ├── schema.prisma    # User + Reading models, unique(user,date,slot)
│   │   ├── migrations/      # incl. readings_value_check (40–600)
│   │   └── seed.js          # idempotent demo seed
│   ├── src/
│   │   ├── config/          # prisma client (test-DB aware), env
│   │   ├── controllers/     # thin: auth, reading, report
│   │   ├── services/        # business logic: auth, reading, report
│   │   ├── validators/      # readingValidator (all 5 rules, exact messages)
│   │   ├── middleware/      # auth (JWT), errorHandler (central, safe messages)
│   │   ├── routes/          # authRoutes, readingRoutes, reportRoutes
│   │   ├── app.js server.js
│   └── tests/               # auth, readings, reports (+ setup)
├── screenshots/
├── docker-compose.yml       # local Postgres
├── .env.example
└── README.md
```

## Prerequisites

- Node.js ≥ 18, npm ≥ 9
- PostgreSQL 14+ (or Docker), e.g. `docker compose up -d`

## Installation

```bash
git clone https://github.com/siddhid1/sweety.git
cd sweety
npm install --prefix server
npm install --prefix client
```

## PostgreSQL Database Setup

**Option A — Docker (recommended):**

```bash
docker compose up -d
# Postgres at localhost:5433, user/password/db: sweety/sweety123/sweety
```

**Option B — local Postgres:** create databases `sweety` and `sweety_test`, then point
`DATABASE_URL` / `DATABASE_URL_TEST` at them.

## Environment Variable Setup

```bash
cp .env.example server/.env
cp client/.env.example client/.env   # or set VITE_API_URL in your shell
```

Backend (`server/.env`):

```
DATABASE_URL="postgresql://sweety:sweety123@localhost:5433/sweety?schema=public"
DATABASE_URL_TEST="postgresql://sweety:sweety123@localhost:5433/sweety_test?schema=public"
JWT_SECRET="change-me-to-a-long-random-secret-min-32-chars"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
CLIENT_URL="http://localhost:5173"
CLIENT_URLS="http://localhost:5173,http://localhost:4173"   # comma-separated allowed origins
```

Frontend (`client/.env`): `VITE_API_URL="http://localhost:5000/api"`

## Prisma Migration Instructions

```bash
cd server
npx prisma migrate deploy   # or: npx prisma migrate dev (creates a migration)
```

The second migration adds the DB-level glucose range guard:
`ALTER TABLE "readings" ADD CONSTRAINT "readings_value_check" CHECK ("value" >= 40 AND "value" <= 600);`

## Seed Script Instructions

```bash
cd server
npm run db:seed
```

Idempotent (`upsert`): creates/updates demo user **demo@example.com / Demo@12345**
with 13 sample readings spanning Nov 2026, Oct 2026 and Sep 2026. Safe to re-run.

## How to Start the Backend

```bash
cd server
npm run dev     # watch mode → http://localhost:5000 (GET /health)
# production: npm start
```

## How to Start the Frontend

```bash
cd client
npm run dev     # → http://localhost:5173
# production preview: npm run build && npm run preview
```

## How to Run Tests

```bash
cd server
npm test        # 21 tests: 5 auth + 11 readings + 5 reports… (see tests/)
```

Tests run against `DATABASE_URL_TEST` (`sweety_test`) and wipe it clean before each case —
development data is never touched.

## API Endpoint Documentation

Base URL: `http://localhost:5000/api`. Protected routes need
`Authorization: Bearer <JWT>`. Errors: `{ success: false, message }`.

### Authentication

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| POST | `/api/auth/register` | `{ name, email, password }` | 201 + `{ user, token }`; 409 duplicate email |
| POST | `/api/auth/login` | `{ email, password }` | 200 + `{ user, token }`; 401 bad credentials |
| GET | `/api/auth/me` | — | 200 current user (protected) |

### Readings (all protected, strictly scoped to the JWT user)

| Method | Endpoint | Body / Query | Notes |
|--------|----------|--------------|-------|
| GET | `/api/readings` | `?page&limit` optional | No params → full sorted list; with params → `{ data, pagination }` |
| GET | `/api/readings/:id` | — | 404 if not yours |
| POST | `/api/readings` | `{ readingDate: "2026-10-15", timeSlot: "AFTER_LUNCH", value: 145 }` | All 5 rules enforced; 409 duplicate slot |
| PUT | `/api/readings/:id` | same as POST | Rules re-validated; 404 if not yours |
| DELETE | `/api/readings/:id` | — | 404 if not yours |

`timeSlot` ∈ `MORNING, AFTER_BREAKFAST, AFTER_LUNCH, AFTER_DINNER`.
`readingDate` is a calendar `DATE` (`YYYY-MM-DD`), never a timestamp — no timezone shifting.

### Reports (protected, user-isolated)

| Method | Endpoint | Example |
|--------|----------|---------|
| GET | `/api/reports/daily?date=2026-10-15` | Stats + readings for that date |
| GET | `/api/reports/month-to-date?date=2026-10-15` | Stats for Oct 1–15 |
| GET | `/api/reports/monthly?date=2026-10-15` | Stats for full Sep 2026 |

Response: `{ success, data: { date, dateRange: { start, end }, count, highest, lowest, average, readings, message? } }`.
Empty range → `count: 0`, nulls for high/low/avg (never misleading zeros) + friendly message.

## Demo Login Credentials

| Email | Password |
|-------|----------|
| demo@example.com | Demo@12345 |

## Screenshots

| Login | Register |
|-------|----------|
| ![Login](screenshots/01-login.png) | ![Register](screenshots/02-register.png) |

| Dashboard | Readings | Reports |
|-----------|----------|---------|
| ![Dashboard](screenshots/03-dashboard.png) | ![Readings](screenshots/04-readings.png) | ![Reports](screenshots/05-reports.png) |

## Assumptions and Limitations

1. **Auth storage:** JWT in `localStorage` (per assignment's persistence requirement) rather
   than httpOnly cookies — simpler for a decoupled Vite + Express demo; XSS hygiene is the
   trade-off and is documented here.
2. **Date handling:** `readingDate` is a pure calendar date compared lexicographically
   (`YYYY-MM-DD`) against the server-local today; no time-of-day or timezone conversion.
3. **Duplicate-slot wording:** the dynamic message uses the slot's friendly label
   (e.g. `After lunch`), so casing varies by slot while matching the required format.
4. **No refresh tokens / roles / Redis / BullMQ / doctor roles** — out of scope per the
   assignment's bonus priority list; pagination + trend chart + Docker are implemented instead.
5. Tests cover the backend only (React Testing Library left as future work).

## Future Improvements

- httpOnly-cookie auth + refresh-token rotation.
- CSV export of readings; reminder notifications for missed slots.
- Frontend tests (React Testing Library) + GitHub Actions CI.
- Full Docker Compose for API + web (Postgres already composed).
- HbA1c estimate card and 7/30-day rolling averages.
