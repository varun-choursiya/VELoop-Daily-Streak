# VELoop Rewards — Daily Streak Rewards Web Application

A full-stack MERN (MongoDB, Express.js, React 19, Node.js) daily streak rewards web application built strictly to the VELoop specification. The backend serves as the single source of truth for user authentication, streak progression, eligibility, reward configurations, wallet balances, and transaction history. The frontend provides a responsive interface with real-time countdowns, progress tracking, and recent activity history.

---

## 1. Problem Statement & Project Objectives

User engagement and retention platforms rely heavily on daily check-in mechanics. However, client-side gamification often suffers from vulnerabilities such as device clock manipulation, inspect-element bypasses, duplicate claiming across browser tabs, and untrusted client inputs.

### Project Objectives:
- **Server as the Source of Truth**: The client never dictates user identity, current day, reward amounts, currency, eligibility, or unlock timestamps.
- **Atomic Operations & Financial Integrity**: Reward claims, wallet updates, and transaction logging execute within atomic MongoDB multi-document ACID transactions.
- **Idempotency & Race Protection**: Mathematical prevention of duplicate claims and concurrent race conditions via database-level compound unique indexes.
- **Strict Anti-Cheat & Zero-Trust Inputs**: Rejection of any client-supplied claim payloads (`400 UNTRUSTED_CLAIM_INPUT`) and enforcement of authoritative server timestamps for all claim windows.
- **Intuitive, Responsive UX**: Real-time server-synchronized countdowns, clear visual card states (`AVAILABLE`, `CLAIMED`, `LOCKED`, `MISSED`), and live balance tracking.

---

## 2. Implemented Features

### 2.1 Authentication & Security
- **JWT-Based Authentication**: Secure stateless tokens signed with HMAC-SHA256 (`HS256`) and a 7-day lifespan.
- **Password Security**: Passwords hashed using `bcryptjs` (salt cost factor 12).
- **Anti-Timing Attack Protection**: Constant-time dummy hash comparison on login email misses prevents user enumeration.
- **Rate Limiting**: Multi-tiered rate limiting (300 requests/15m globally, 15 attempts/15m on auth, 10 attempts/1m on claims).
- **Security Headers & CORS**: Hardened with `helmet` HTTP headers and origin-whitelisted CORS policies.

### 2.2 Daily Streak Engine
- **7-Day Ladder Progression**: Configurable reward ladder with both in-app points (VES) and real-world rewards (Amazon Gift Cards).
- **Authoritative Server Time**: Countdowns synchronize against server time offsets; client device clock alterations cannot bypass cooldowns.
- **24-Hour Cooldown (`claimIntervalHours = 24`)**: Day $N+1$ unlocks 24 hours after Day $N$ is claimed.
- **24-Hour Expiration Window (`claimWindowHours = 24`)**: Missed claim windows trigger a clean cycle reset to Day 1.
- **Day 7 Ultimate Reward**: Claiming Day 7 transitions the cycle to `COMPLETED` and locks further claims until a new cycle is started.
- **Duplicate & Race Protection**: MongoDB ACID transaction coupled with a compound unique index on `{ userId: 1, cycleId: 1, day: 1 }` prevents double-crediting.

### 2.3 Wallet & Activity History
- **Dual-Currency Wallet**: Authoritative tracking for `vesBalance` (points) and `amazonGiftCardBalanceInr` (INR).
- **Immutable Transaction Ledger**: Every reward credit logs an immutable `WalletTransaction` with balance before/after audit values.
- **Activity Feed**: Real-time display of the user's recent successful claims with formatted timestamps and reward details.

---

## 3. Technology Stack

### Backend
- **Runtime**: Node.js v18+ (tested on Node.js v24, ES Modules)
- **Web Framework**: Express.js 5
- **Database & ODM**: MongoDB Atlas, Mongoose 8
- **Authentication**: `jsonwebtoken` (HS256), `bcryptjs`
- **Security & Utilities**: `helmet`, `cors`, `express-rate-limit`, `express-validator`, `morgan`, `dotenv`

### Frontend
- **Framework**: React 19, React DOM 19
- **Build Tool**: Vite 7
- **Routing**: React Router 7 (`react-router-dom`)
- **HTTP Client**: Axios (with Bearer token request and 401 response interceptors)
- **Styling**: Vanilla CSS Modules, Bootstrap 5.3 utilities
- **Icons**: Lucide React

---

## 4. 7-Day Reward Configuration

Configured and seeded in MongoDB (`backend/seed/streakRewards.js`):

| Day | Reward Type | Currency | Amount | Title | Subtitle | Asset Type |
|---|---|---|---|---|---|---|
| **Day 1** | VES | VES | 5 | Daily Reward | 5 VEs | Coin |
| **Day 2** | VES | VES | 10 | Daily Reward | 10 VEs | Coin |
| **Day 3** | VES | VES | 15 | Daily Reward | 15 VEs | Coin |
| **Day 4** | AMAZON_GIFT_CARD | INR | ₹1 | Amazon Gift Card | ₹1 Amazon Gift Card | Gift Card |
| **Day 5** | AMAZON_GIFT_CARD | INR | ₹2 | Amazon Gift Card | ₹2 Amazon Gift Card | Gift Card |
| **Day 6** | VES | VES | 30 | Daily Reward | 30 VEs | Coin |
| **Day 7** | AMAZON_GIFT_CARD | INR | ₹5 | Ultimate Reward | ₹5 Amazon Gift Card | Crown |

---

## 5. Project Directory Structure

```text
veloop-daily-streak/
├── backend/
│   ├── seed/
│   │   ├── demoUser.js          # Demo user account seeder
│   │   └── streakRewards.js     # 7-day reward configuration seeder
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # Mongoose MongoDB connection
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── streak.controller.js
│   │   │   └── wallet.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js       # JWT extraction and HS256 validation
│   │   │   └── error.middleware.js      # Global error and E11000 handler
│   │   ├── models/
│   │   │   ├── AuditLog.js
│   │   │   ├── StreakClaim.js           # Unique index (userId, cycleId, day)
│   │   │   ├── StreakConfig.js
│   │   │   ├── StreakCycle.js           # Partial unique index (userId, ACTIVE)
│   │   │   ├── StreakReward.js
│   │   │   ├── User.js
│   │   │   ├── Wallet.js
│   │   │   └── WalletTransaction.js     # Immutable financial ledger
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── streak.routes.js
│   │   │   └── wallet.routes.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   └── streak.service.js        # Core streak engine & ACID transactions
│   │   ├── utils/
│   │   │   ├── httpError.js
│   │   │   └── ids.js
│   │   └── server.js            # Express server initialization & routes
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/              # Coin, card, crown, and brand illustrations
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Token persistence and global auth state
│   │   ├── pages/
│   │   │   ├── DailyStreak/
│   │   │   │   ├── DailyStreak.module.css
│   │   │   │   └── DailyStreakPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── services/
│   │   │   ├── api.js           # Axios instance & interceptors
│   │   │   └── streakApi.js     # Endpoint functions
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── App.jsx              # Protected route definitions
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json              # SPA rewrite rule for Vercel
│   └── vite.config.js
├── docs/
│   ├── API.md                   # Complete REST API specification
│   ├── API_DOCUMENTATION.md     # API reference summary
│   ├── ARCHITECTURE.md          # System architecture & Mermaid diagrams
│   ├── DATABASE.md              # Database schemas, indexes, & ER diagram
│   ├── SECURITY.md              # Anti-cheat & threat model
│   ├── SUBMISSION_CHECKLIST.md  # Readiness audit & deliverables status
│   └── TESTING.md               # QA audit & verified test results
├── postman/
│   └── VELoop-Daily-Streak.postman_collection.json
├── .gitignore
└── README.md
```

---

## 6. Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Port for the Express server. |
| `MONGO_URI` | **Yes** | — | MongoDB Atlas connection string (replica set required). |
| `JWT_SECRET` | **Yes** | — | Secret string for HMAC-SHA256 signing (minimum 32 characters). |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiration duration (e.g. `7d`, `24h`). |
| `CLIENT_URL` | No | `http://localhost:5173` | Comma-separated list of additional allowed CORS origins. |
| `DEMO_NAME` | No | `VELoop Demo` | Display name for seed demo account. |
| `DEMO_EMAIL` | No | `demo@veloop.local` | Email for seed demo account. |
| `DEMO_PASSWORD` | No | `Demo@12345` | Password for seed demo account. |

### Frontend (`frontend/.env`)
| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:5000/api` | Target backend REST API URL. |

---

## 7. Local Setup Instructions

### Prerequisites
- Node.js v18.0.0 or higher
- MongoDB Atlas cluster URI (or local MongoDB configured with a replica set for transactions)

### 1. Clone the Repository
```bash
git clone https://github.com/varun-choursiya/VELoop-Daily-Streak.git
cd VELoop-Daily-Streak
```

### 2. Backend Installation & Startup
```bash
cd backend
npm install

# Create environment file from template
cp .env.example .env
# Edit .env and supply your MONGO_URI and a secure JWT_SECRET (>= 32 chars)

# Seed streak configuration (totalDays: 7, 24h interval, 7 rewards)
npm run seed

# (Optional) Seed ready-to-use demo user
npm run seed:demo

# Start backend in development mode (with nodemon)
npm run dev
# Server starts on http://localhost:5000 (Health check: http://localhost:5000/health)
```

### 3. Frontend Installation & Startup
```bash
cd ../frontend
npm install

# Create environment file from template
cp .env.example .env
# Ensure VITE_API_URL=http://localhost:5000/api in frontend/.env

# Start Vite development server
npm run dev
# Application starts on http://localhost:5173
```

### 4. Compiling Production Bundle
```bash
cd frontend
npm run build       # Compiles optimized bundle to dist/
npm run preview     # Previews production build locally
```

---

## 8. Demo Account Credentials

If seeded via `npm run seed:demo`, log in with:
- **Email**: `demo@veloop.local`
- **Password**: `Demo@12345`

---

## 9. Testing & Quality Assurance

Comprehensive test audit results and procedures are recorded in **[docs/TESTING.md](docs/TESTING.md)**.

### Postman Test Suite:
Import `postman/VELoop-Daily-Streak.postman_collection.json` into Postman. It includes pre-written assertion tests for:
- User registration and login
- Authenticated profile retrieval (`/api/auth/me`)
- Authoritative streak status retrieval
- Empty-body claim verification
- Untrusted parameter tampering rejection (`400 UNTRUSTED_CLAIM_INPUT`)
- Wallet balance and immutable transaction queries
- Health check

### Verified Live Scenarios (Audited):
- `GET /health` -> `200 OK`
- `GET /api/daily-streak` (unauthenticated) -> `401 AUTH_REQUIRED`
- `GET /api/daily-streak` (invalid JWT) -> `401 AUTH_INVALID`
- `POST /api/auth/register` (invalid inputs) -> `400 VALIDATION_ERROR`
- `POST /api/auth/register` (duplicate email) -> `409 EMAIL_EXISTS`
- `POST /api/auth/login` (bad credentials) -> `401 INVALID_CREDENTIALS`
- `POST /api/auth/login` (valid demo credentials) -> `200 OK`
- `POST /api/daily-streak/claim` (untrusted body `{ day: 7 }`) -> `400 UNTRUSTED_CLAIM_INPUT`
- `POST /api/daily-streak/claim` (`{}` during cooldown) -> `409 STREAK_LOCKED`
- Production Vite build -> `1758 modules transformed in 2.72s (Exit code 0)`

---

## 10. Deployment Instructions

### Frontend (Vercel)
- **Live Deployment**: `https://ve-loop-daily-streak.vercel.app`
- **Configuration**: `frontend/vercel.json` provides SPA fallback rewrites:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/" }]
  }
  ```
- **Environment Variables**: Set `VITE_API_URL` to your production backend URL.

### Backend (Render / Cloud Container)
- **Build Command**: `npm install`
- **Start Command**: `npm run start` (or `node src/server.js`)
- **Reverse Proxy**: Backend includes `app.set("trust proxy", 1)`.
- **CORS Whitelist**: Ensure `CLIENT_URL` includes your deployed frontend domain.

---

## 11. Known Limitations & Future Improvements

### Known Limitations:
1. **Replica Set Dependency**: Multi-document transactions require a replica set. Standalone MongoDB installations without replica set initiation cannot run `session.withTransaction`.
2. **Single Active Cycle**: Users are constrained to one active cycle at a time by partial unique index design.
3. **No Native Test Runner Script**: Test execution currently relies on Postman and live server integration checks rather than a bundled `npm test` script.

### Future Improvements:
1. **CPA Offerwall Integration**: Connect the client demo modal to third-party reward offerwall APIs.
2. **Push Notifications & Reminders**: Web Push notifications when the 24-hour claim window unlocks.
3. **Gift Card Redemption Module**: Add an automated claim/code generation system for Amazon Gift Cards.
4. **Refresh Token Flow**: Introduce short-lived access tokens with `HttpOnly` refresh token rotation.

---

## 12. Documentation Index

- **[REST API Specification](docs/API.md)** — Exhaustive route specifications, live payload schemas, error tables, and validation rules.
- **[System Architecture](docs/ARCHITECTURE.md)** — Architectural diagrams, request flows, transaction lifecycles, and state machines.
- **[Database Schemas & Models](docs/DATABASE.md)** — Mongoose models, indexes, unique constraints, and transaction rules.
- **[Security Architecture](docs/SECURITY.md)** — Threat model, zero-trust parameter enforcement, and audit logs.
- **[Testing & Verification Guide](docs/TESTING.md)** — Audited test results, manual checklist, and Postman setup.
- **[Project Submission Checklist](docs/SUBMISSION_CHECKLIST.md)** — Deliverables status, deployment verification, and readiness assessment.
