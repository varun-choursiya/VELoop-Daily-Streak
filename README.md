# VELoop Daily Streak Rewards — MERN Implementation

A production-ready Full-Stack MERN Daily Streak Rewards application built strictly to the VELoop specification. The backend serves as the single source of truth for user authentication, streak progression, eligibility, reward configurations, wallet balances, and transaction history. The frontend provides a responsive interface with real-time countdowns, progress tracking, and recent activity history.

---

## Technology Stack

- **Backend**: Node.js (ES Modules), Express.js 5, MongoDB + Mongoose 8
- **Frontend**: React 19, Vite 7, React Router 7, Bootstrap 5, CSS Modules, Lucide React, Axios
- **Database**: MongoDB Atlas (Multi-document ACID transactions via replica set)
- **Security**: JWT authentication, bcryptjs password hashing, Helmet headers, express-rate-limit, express-validator

---

## 7-Day Reward Configuration

Configured and seeded in MongoDB (`backend/seed/streakRewards.js`):

| Day | Reward Type | Currency | Amount | Display Label | Asset Type |
|---|---|---|---|---|---|
| **Day 1** | VES | VES | 5 | +5 VES | Coin |
| **Day 2** | VES | VES | 10 | +10 VES | Coin |
| **Day 3** | VES | VES | 15 | +15 VES | Coin |
| **Day 4** | AMAZON_GIFT_CARD | INR | ₹1 | ₹1 Amazon Gift Card | Gift Card |
| **Day 5** | AMAZON_GIFT_CARD | INR | ₹2 | ₹2 Amazon Gift Card | Gift Card |
| **Day 6** | VES | VES | 30 | +30 VES | Coin |
| **Day 7** | AMAZON_GIFT_CARD | INR | ₹5 | ₹5 Amazon Gift Card (Ultimate) | Crown |

---

## Business Rules & Streak Logic

### Claim Window Assumptions
- `claimIntervalHours = 24` — Cooldown period after claiming Day $N$ before Day $N+1$ unlocks.
- `claimWindowHours = 24` — Duration after unlock before streak is considered missed.
- `resetOnMissedDay = true` — Enforces streak reset if claim window is missed.

### Progression Flow:
1. **Day 1**: Immediately `AVAILABLE` for newly registered users.
2. **Progression**: After claiming Day $N$, Day $N+1$ unlocks after 24 hours (`nextClaimAt = claimedAt + 24h`).
3. **Missed Day Reset**: If `now > nextClaimAt + 24h`, the active cycle resets on the next status/claim check, and the user restarts from Day 1 with `wasReset: true` and reason `"REQUIRED_CLAIM_WINDOW_MISSED"`.
4. **Completed 7-Day Cycle**: When Day 7 is claimed, the cycle transitions to `COMPLETED`. All 7 cards display as `CLAIMED`. The backend sets `currentDay = 8` and `status = "COMPLETED"`. The user sees their completed achievements, and starting a new cycle requires a fresh cycle creation. Double claiming on the same day is strictly prohibited.

---

## Security Architecture

1. **Source of Truth**: The client never determines user ID, streak count, current day, reward amounts, currency, eligibility, or unlock times.
2. **Identity from JWT**: `req.user._id` is derived from verified JWT tokens in authorization middleware (`requireAuth`). Client-supplied user IDs in request bodies are ignored.
3. **Atomic Operations**: Reward claims, wallet updates, and transaction logging execute inside an atomic MongoDB transaction (`session.withTransaction`).
4. **Concurrency & Idempotency**:
   - Compound unique index on claims:
     ```javascript
     streakClaimSchema.index({ userId: 1, cycleId: 1, day: 1 }, { unique: true });
     ```
   - Partial unique index on active cycles:
     ```javascript
     streakCycleSchema.index(
       { userId: 1, status: 1 },
       { unique: true, partialFilterExpression: { status: "ACTIVE" } }
     );
     ```
   - Concurrent claim requests result in write conflicts or duplicate key errors (`11000`) that safely abort secondary transactions without double-crediting wallets.
5. **Rate Limiting & Headers**: Helmet security headers and IP rate limiting (300 requests / 15 minutes) are enforced on all API routes.

---

## Quickstart & Installation

### Prerequisites
- Node.js v18+ (tested on Node.js v24)
- MongoDB Atlas database cluster URI

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill MONGO_URI and JWT_SECRET in .env

npm run seed        # Seeds StreakConfig and the 7 reward configurations
npm run seed:demo   # Seeds ready-to-use demo account (demo@veloop.local / Demo@12345)
npm run dev         # Starts API server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Ensure VITE_API_URL=http://localhost:5000/api in .env

npm run dev         # Starts Vite dev server on http://localhost:5173
```

### 3. Production Build (Frontend)
```bash
cd frontend
npm run build       # Compiles optimized production bundle in dist/
npm run preview     # Previews production bundle locally
```

---

## Demo Account Credentials

A pre-configured demo user can be seeded instantly:
```bash
cd backend
npm run seed:demo
```
- **Email**: `demo@veloop.local`
- **Password**: `Demo@12345`

---

## Automated Testing

An automated integration test suite built with Node.js native test runner (`node:test`) is included:

```bash
cd backend
npm test
```

### Scenarios Tested (9/9 Passing):
- Unauthenticated status request (`401 AUTH_REQUIRED`)
- Unauthenticated claim request (`401 AUTH_REQUIRED`)
- Invalid JWT token (`401 AUTH_INVALID`)
- User registration & initial streak status retrieval (Day 1 `AVAILABLE`, Days 2–7 `LOCKED`)
- Rejection of client-supplied fake parameters (`userId`, fake day 7, fake reward 9999)
- Atomic wallet balance credit and `WalletTransaction` ledger creation
- Duplicate claim prevention on same day (`409 ALREADY_CLAIMED` / `STREAK_LOCKED`)
- Locked-day claim prevention (`409 STREAK_LOCKED`)
- High-concurrency race condition (5 simultaneous requests; exactly 1 succeeds, 4 rejected, 0 double credits)

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`)
- `POST /api/auth/login` — Authenticate and receive JWT
- `GET /api/auth/me` — Return current authenticated user profile

### Daily Streak
- `GET /api/daily-streak` — Retrieve authoritative streak status, rewards, and server time
- `GET /api/daily-streak/status` — Live status endpoint used for live countdown refresh
- `POST /api/daily-streak/claim` — Claim the current eligible reward (body parameters ignored)
- `GET /api/daily-streak/history` — List authenticated user's claim history

### Wallet
- `GET /api/wallet` — Retrieve VES and Amazon gift card balances
- `GET /api/wallet/transactions` — Retrieve immutable transaction ledger

### System
- `GET /health` — Service health check

---

## Documentation Index

- [API Documentation](file:///c:/Users/Varun%20Choursiya/Downloads/veloop-daily-streak-mern/veloop-daily-streak/docs/API_DOCUMENTATION.md) — Detailed request/response payloads, validation rules, and error codes.
- [Database Schema Reference](file:///c:/Users/Varun%20Choursiya/Downloads/veloop-daily-streak-mern/veloop-daily-streak/docs/DATABASE.md) — Collections, field types, compound unique indexes, and ACID guarantees.
- [Security Architecture](file:///c:/Users/Varun%20Choursiya/Downloads/veloop-daily-streak-mern/veloop-daily-streak/docs/SECURITY.md) — Threat model, zero-trust parameter enforcement, and audit logs.
- [Testing & Verification Guide](file:///c:/Users/Varun%20Choursiya/Downloads/veloop-daily-streak-mern/veloop-daily-streak/docs/TESTING.md) — Automated test suite details and step-by-step manual testing checklist.
