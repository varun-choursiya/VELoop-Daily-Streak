# VELoop Rewards — Testing & Quality Assurance Report

This document details the test strategy, execution audit, verified results, and manual acceptance procedures for the **VELoop Rewards — Daily Streak** application.

---

## 1. Source of Truth & Repository Audit

### Critical Discrepancy Report:
- **Discrepancy**: Prior project documentation in `README.md` referenced an automated test suite executed via `npm test` under `backend/` with a claim of "9/9 Passing".
- **Source Code Audit**: Inspection of `backend/package.json` revealed **no `"test"` script** defined, and no test runner files (e.g. `*.test.js` or `*.spec.js`) were present in the repository.
- **Resolution**: This report documents the **actual** state of tests, separating live verified tests executed during this audit from tests that were not run or require developer manual execution. No test results are fabricated.

---

## 2. Testing Methodology & Verification Categories

In compliance with the project audit rules, every test scenario is categorized into one of five statuses:
1. **Verified by Live Execution (Audited)**: Executed directly against the running API or build tools during this audit with verified HTTP responses and exit codes.
2. **Implemented in Code**: Fully present and functional in the backend/frontend codebase, confirmed by source code inspection.
3. **Manually Verified by Developer**: Tested by developer interaction through the UI or Postman.
4. **Not Executed**: Not run during this audit to avoid mutating database state or because it requires time-advancement simulation.
5. **Known Issue / Gap**: A recognized discrepancy between documentation and implementation.

---

## 3. Verified Test Results Matrix

The following table records the tests performed against the live backend (`http://localhost:5000`) and frontend build system during this audit:

| ID | Test Scenario | Target | Verification Method | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| **T01** | Service Health Check | `GET /health` | HTTP GET | 200 OK, service name | 200 OK `{"success":true,"service":"veloop-daily-streak-api"}` | **Verified by Live Execution** |
| **T02** | Unauthenticated Request Protection | `GET /api/daily-streak` | HTTP GET (No token) | 401 Unauthorized, `AUTH_REQUIRED` | 401 `{"success":false,"code":"AUTH_REQUIRED","message":"Please log in to continue."}` | **Verified by Live Execution** |
| **T03** | Invalid / Malformed JWT | `GET /api/daily-streak` | HTTP GET (`Bearer invalid123`) | 401 Unauthorized, `AUTH_INVALID` | 401 `{"success":false,"code":"AUTH_INVALID","message":"Please log in to continue."}` | **Verified by Live Execution** |
| **T04** | Registration Input Validation | `POST /api/auth/register` | HTTP POST (Malformed fields) | 400 Bad Request, `VALIDATION_ERROR` | 400 `{"success":false,"code":"VALIDATION_ERROR","message":"Please provide valid account details."}` | **Verified by Live Execution** |
| **T05** | Duplicate Email Registration | `POST /api/auth/register` | HTTP POST (Existing email) | 409 Conflict, `EMAIL_EXISTS` | 409 `{"success":false,"code":"EMAIL_EXISTS","message":"An account with this email already exists."}` | **Verified by Live Execution** |
| **T06** | Invalid Login Credentials | `POST /api/auth/login` | HTTP POST (Bad password) | 401 Unauthorized, `INVALID_CREDENTIALS` | 401 `{"success":false,"code":"INVALID_CREDENTIALS","message":"Invalid email or password."}` | **Verified by Live Execution** |
| **T07** | Demo User Authentication | `POST /api/auth/login` | HTTP POST (`demo@veloop.local`) | 200 OK, valid JWT, user object | 200 OK `{ success: true, user: { id, name, email }, token: "..." }` | **Verified by Live Execution** |
| **T08** | Streak Status Retrieval | `GET /api/daily-streak` | HTTP GET (Valid JWT) | 200 OK, 7 reward cards, wallet | 200 OK `{ serverTime, wallet, streak, rewards: [7 cards] }` | **Verified by Live Execution** |
| **T09** | Parameter Tampering Rejection | `POST /api/daily-streak/claim` | HTTP POST (`{"day": 7}`) | 400 Bad Request, `UNTRUSTED_CLAIM_INPUT` | 400 `{"success":false,"code":"UNTRUSTED_CLAIM_INPUT","message":"Claim day, reward and user identity are strictly controlled by the server."}` | **Verified by Live Execution** |
| **T10** | Premature / Locked Claim Rejection | `POST /api/daily-streak/claim` | HTTP POST (`{}`) while locked | 409 Conflict, `STREAK_LOCKED` | 409 `{"success":false,"code":"STREAK_LOCKED","message":"Your next reward is not available yet."}` | **Verified by Live Execution** |
| **T11** | Wallet Balance Query | `GET /api/wallet` | HTTP GET (Valid JWT) | 200 OK, balances returned | 200 OK `{"success":true,"wallet":{"vesBalance":15,"amazonGiftCardBalanceInr":0}}` | **Verified by Live Execution** |
| **T12** | Wallet Transactions Ledger Query | `GET /api/wallet/transactions` | HTTP GET (Valid JWT) | 200 OK, array of transactions | 200 OK `{ success: true, transactions: [...] }` | **Verified by Live Execution** |
| **T13** | Streak Claim History Query | `GET /api/daily-streak/history` | HTTP GET (Valid JWT) | 200 OK, populated claims | 200 OK `{ success: true, history: [...] }` | **Verified by Live Execution** |
| **T14** | Frontend Production Build | `frontend/` | `npm run build` (Vite) | Exit code 0, dist/ bundle | Exit code 0, 1758 modules transformed in 2.72s | **Verified by Live Execution** |
| **T15** | Deployed Frontend Availability | `https://ve-loop-daily-streak.vercel.app` | HTTP GET / HTTPS | HTTP 200 OK | HTTP 200 OK (Vercel CDN HIT) | **Verified by Live Execution** |

---

## 4. Test Scenarios Not Run & Implementation Audit

The following scenarios are implemented in code but were **not run** during this audit session to maintain non-destructive safety on live data:

### 4.1 Valid Reward Claim & Wallet Credit (New User)
- **Status**: Implemented in code (`backend/src/services/streak.service.js:claimCurrentReward`)
- **Code Audit**: Uses `session.withTransaction`. Verifies Day 1 eligibility, creates `StreakClaim`, increments `Wallet`, appends `WalletTransaction`, and writes `AuditLog`.
- **Reason Not Run**: Requires registering a new disposable account and claiming Day 1.

### 4.2 Duplicate Claim Prevention on Same Day
- **Status**: Implemented in code (`backend/src/models/StreakClaim.js`)
- **Code Audit**: Compound unique index `{ userId: 1, cycleId: 1, day: 1 }` guarantees database-level duplicate prevention. Catch block in `streak.service.js` catches error code `11000` and returns `409 ALREADY_CLAIMED`.
- **Reason Not Run**: The demo user was already at Day 2 in locked cooldown, which properly rejected with `STREAK_LOCKED` before reaching duplicate check.

### 4.3 High-Concurrency Race Condition Protection
- **Status**: Implemented in code (`session.withTransaction` + compound unique index)
- **Code Audit**: Simultaneous requests are serialized by MongoDB transaction write locks; the secondary request encounters write conflict or `11000` duplicate key exception, triggering rollback.
- **Reason Not Run**: High-concurrency load testing requires external siege/k6/autocannon script.

### 4.4 Streak Reset on Window Expiration (Missed Day)
- **Status**: Implemented in code (`maybeResetMissedCycle` in `streak.service.js`)
- **Code Audit**: Evaluates `config.resetOnMissedDay && cycle.currentDay > 1 && cycle.windowExpiresAt && now > cycle.windowExpiresAt`. If true, transitions cycle to `RESET` with `resetReason: "REQUIRED_CLAIM_WINDOW_MISSED"` and generates a new cycle at Day 1.
- **Reason Not Run**: Requires mocking system clock or allowing 48 hours to elapse naturally.

### 4.5 7-Day Cycle Completion
- **Status**: Implemented in code (`claimCurrentReward` lines 383–388)
- **Code Audit**: When Day 7 is claimed, sets `cycle.currentDay = 8`, `cycle.status = "COMPLETED"`, and clears `nextClaimAt`.
- **Reason Not Run**: Requires completing 7 full 24-hour cycles.

---

## 5. Postman Collection Verification Guide

The repository includes a pre-configured Postman collection at:
`postman/VELoop-Daily-Streak.postman_collection.json`

### Included Requests:
1. `Auth/Register` — Includes test script asserting HTTP 201/409 and saving token.
2. `Auth/Login` — Includes test script saving `pm.collectionVariables.token`.
3. `Auth/Me` — Tests JWT profile resolution.
4. `Daily Streak/Get Streak` — Tests full streak state retrieval.
5. `Daily Streak/Get History` — Tests claim history retrieval.
6. `Daily Streak/Claim Current Reward` — Posts `{}` to claim active day.
7. `Daily Streak/Security - Fake Day/Reward Payload` — Asserts that `{ day: 7, reward: 5000 }` receives HTTP 400.
8. `Wallet/Get Wallet` — Tests wallet balance retrieval.
9. `Wallet/Get Wallet Transactions` — Tests transaction history retrieval.
10. `Health` — Tests GET `http://localhost:5000/health`.

### Instructions to Execute Postman Tests:
1. Open Postman and click **Import**.
2. Select `postman/VELoop-Daily-Streak.postman_collection.json`.
3. In the collection variables, verify:
   - `baseUrl`: `http://localhost:5000/api`
   - `email`: `demo@veloop.local`
   - `password`: `Demo@12345`
4. Run `Auth/Login` to populate the `token` variable.
5. Execute the remaining requests in sequence.

---

## 6. Frontend UI Acceptance Checklist

| Component / Feature | Implementation Location | Verified Behavior |
|---|---|---|
| **Branded Initial Loader** | `DailyStreakPage.jsx:231-247` | Displays animated sparkles icon and progress bar during data fetch. |
| **Error & Retry State** | `DailyStreakPage.jsx:251-270` | Displays shield icon, user-friendly error message, and "Retry" button. |
| **Header Wallet Pill** | `DailyStreakPage.jsx:314-323` | Displays VES coin icon and live balance from backend wallet. |
| **Header Streak Counter** | `DailyStreakPage.jsx:326-338` | Displays flame icon and active streak day count. |
| **Account & Logout Popover** | `DailyStreakPage.jsx:341-383` | Click opens dropdown showing email and "Log out" button. |
| **Reset Banner** | `DailyStreakPage.jsx:403-418` | Displays notification banner when `streak.wasReset` is true. |
| **Live Countdown** | `DailyStreakPage.jsx:57-105` | Evaluates `nextClaimAt - (Date.now() + serverOffset)`; triggers silent reload on zero. |
| **7 Reward Cards Grid** | `DailyStreakPage.jsx:568-694` | Renders cards with server-assigned classes: `available`, `claimed`, `locked`, `missed`. |
| **CPA Verification Modal** | `DailyStreakPage.jsx:786-811` | Displays 900ms simulated reward verification animation upon claim click. |
| **Claim History List** | `DailyStreakPage.jsx:733-782` | Shows recent 5 claims with formatted dates, reward titles, and transaction amounts. |
