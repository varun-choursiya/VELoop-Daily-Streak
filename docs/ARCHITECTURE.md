# VELoop Rewards — System Architecture

This document describes the architectural design, component interactions, request lifecycles, transactional boundaries, and security mechanisms of the **VELoop Rewards — Daily Streak** application.

---

## 1. High-Level Architecture Overview

VELoop Rewards follows a modern 3-tier decoupled architecture:
1. **Presentation Layer (Frontend)**: React 19 Single Page Application (SPA) bundled with Vite 7, styled using modular CSS and Bootstrap 5 utilities, deployed on Vercel.
2. **Application & API Layer (Backend)**: Node.js (ES Modules) Express 5 REST API enforcing zero-trust validation, JWT authentication, rate limiting, and security headers, deployed on Render.
3. **Persistence Layer (Database)**: MongoDB Atlas replica set providing multi-document ACID transactions, unique indexes, and schema enforcement through Mongoose 8.

```mermaid
graph TD
    User([User Browser / Mobile])
    
    subgraph Frontend ["Frontend (React 19 + Vite 7)"]
        UI[UI Components & Pages]
        AuthCtx[AuthContext / Token Storage]
        AxiosClient[Axios API Client + Interceptors]
    end

    subgraph Backend ["Backend (Express 5 REST API)"]
        SecurityMW[Security Middlewares<br/>Helmet, CORS, Rate Limiters]
        AuthMW[requireAuth Middleware<br/>JWT HS256 Verification]
        InputMW[requireEmptyClaimBody Middleware]
        Controllers[API Controllers<br/>auth, streak, wallet]
        Services[Domain Services<br/>auth.service, streak.service]
    end

    subgraph Database ["Database (MongoDB Atlas Replica Set)"]
        Users[(Users)]
        Wallets[(Wallets)]
        Cycles[(StreakCycles)]
        Claims[(StreakClaims)]
        TxLedger[(WalletTransactions)]
        AuditLogs[(AuditLogs)]
        Configs[(StreakConfig & Rewards)]
    end

    User -->|Interacts| UI
    UI -->|Dispatches Actions| AxiosClient
    AuthCtx -.->|Provides Bearer Token| AxiosClient
    AxiosClient -->|HTTP/JSON Requests| SecurityMW
    SecurityMW --> AuthMW
    AuthMW --> InputMW
    InputMW --> Controllers
    Controllers --> Services
    Services -->|ACID Multi-Document Transactions| Database
```

---

## 2. Frontend-to-Backend Request Flow

Every network interaction follows a deterministic path through the application stack:

1. **Client Request Initiation**:
   - The user triggers an action (e.g., claiming a streak or loading the page).
   - An Axios instance configured in `frontend/src/services/api.js` intercepts the outgoing request.
   - The request interceptor inspects `localStorage` for `veloop_token`. If present, it attaches the `Authorization: Bearer <token>` header.

2. **Reverse Proxy & Transport Security**:
   - Express is configured with `app.set("trust proxy", 1)` to handle reverse proxies (Render / Vercel).
   - `helmet()` automatically injects Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), and frame restrictions.
   - `cors(corsOptions)` verifies the `Origin` header against an approved whitelist (`https://ve-loop-daily-streak.vercel.app`, `http://localhost:5173`, and `CLIENT_URL`).

3. **Global Rate Limiting**:
   - Global rate limiter permits up to 300 requests per 15-minute window across `/api/*`.
   - Endpoint-specific limiters apply stricter thresholds: 15 per 15m for auth, 10 per 1m for claim.

4. **Authentication & Identity Resolution**:
   - Protected routes execute `requireAuth` (`backend/src/middleware/auth.middleware.js`).
   - The middleware verifies the JWT against `JWT_SECRET` with explicit `{ algorithms: ["HS256"] }`.
   - It validates that `payload.sub` is a valid MongoDB `ObjectId`.
   - It loads the user record from MongoDB (`User.findById(payload.sub).select("_id name email")`) and binds it to `req.user`.

5. **Client Input Strictness**:
   - On `/api/daily-streak/claim`, `requireEmptyClaimBody` enforces that `req.body` and `req.query` contain **no keys**. Client-provided user IDs, days, or amounts are rejected with `400 UNTRUSTED_CLAIM_INPUT`.

6. **Controller & Service Delegation**:
   - The controller delegates all business logic to domain services (`auth.service.js`, `streak.service.js`).
   - The service coordinates MongoDB queries and transactions.

7. **Response & Session Expiration Handling**:
   - The backend returns standardized JSON responses.
   - If a 401 response is returned, the frontend Axios response interceptor immediately purges `veloop_token` from `localStorage`, causing `AuthContext` to redirect the user to `/login`.

---

## 3. Authentication & Authorization Architecture

Authentication is stateless and cryptographically verified:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Frontend SPA
    participant AuthRoute as /api/auth/*
    participant AuthService as auth.service.js
    participant MongoDB as MongoDB Atlas

    Note over User,MongoDB: Registration Flow
    User->>Frontend: Enters Name, Email, Password
    Frontend->>AuthRoute: POST /api/auth/register
    AuthRoute->>AuthService: register({ name, email, password })
    AuthService->>MongoDB: User.findOne({ email })
    alt Email Exists
        AuthService-->>Frontend: 409 EMAIL_EXISTS
    else Email Unique
        AuthService->>AuthService: bcrypt.hash(password, 12)
        AuthService->>MongoDB: User.create() & Wallet.create({ userId })
        AuthService->>AuthService: jwt.sign({ sub: user._id }, JWT_SECRET, { expiresIn: "7d" })
        AuthService-->>Frontend: 201 Created { user, token }
        Frontend->>Frontend: localStorage.setItem("veloop_token", token)
    end

    Note over User,MongoDB: Protected Request Flow
    User->>Frontend: Navigates to /daily-streak
    Frontend->>AuthRoute: GET /api/daily-streak (Authorization: Bearer <token>)
    AuthRoute->>AuthRoute: jwt.verify(token, JWT_SECRET, algorithms: ["HS256"])
    AuthRoute->>MongoDB: User.findById(payload.sub)
    AuthRoute-->>Frontend: 200 OK (Streak Data & Wallet)
```

### Key Security Guardrails:
- **Anti-Timing Attack Protection**: During login, if an email is not found, `auth.service.js` executes `bcrypt.compare(password, DUMMY_HASH)`. This ensures that invalid emails consume the same computational time as valid emails, thwarting user enumeration attacks.
- **Algorithm Lockdown**: JWT verification explicitly enforces `algorithms: ["HS256"]`, preventing algorithm switching attacks (such as "none" or RS256 confusion).
- **Zero Client Identity Authority**: The client never sends a `userId`. All user-specific database lookups strictly use `req.user._id` derived from the verified token.

---

## 4. Daily Streak Claim Lifecycle & State Machine

The daily streak progression is modeled as a state machine governed by server time:

```mermaid
stateDiagram-v2
    [*] --> CycleCreated: User Registers / Initializes
    CycleCreated --> Day1Available: Day 1 (No cooldown required)
    
    Day1Available --> Day1Claimed: POST /claim (Day 1)
    Day1Claimed --> CooldownWait: nextClaimAt = now + 24h<br/>windowExpiresAt = nextClaimAt + 24h
    
    CooldownWait --> NextDayAvailable: now >= nextClaimAt AND now <= windowExpiresAt
    CooldownWait --> StreakReset: now > windowExpiresAt (Window Missed)
    
    NextDayAvailable --> IntermediateClaimed: POST /claim (Days 2 to 6)
    IntermediateClaimed --> CooldownWait: Progress to Day N + 1
    NextDayAvailable --> StreakReset: now > windowExpiresAt (Window Missed)
    
    NextDayAvailable --> Day7Claimed: POST /claim (Day 7 Ultimate Reward)
    Day7Claimed --> CycleCompleted: status = "COMPLETED"<br/>currentDay = 8
    
    StreakReset --> Day1Available: Active cycle marked RESET<br/>New active cycle created at Day 1
    CycleCompleted --> [*]
```

### Business Rules & Windows:
1. **`claimIntervalHours = 24`**: The mandatory waiting period after claiming Day $N$ before Day $N+1$ unlocks.
2. **`claimWindowHours = 24`**: The window after unlock during which the user must claim Day $N+1$.
3. **Missed Window Expiration**: If `serverTime > cycle.windowExpiresAt`, the cycle transitions to `status: "RESET"` with `resetReason: "REQUIRED_CLAIM_WINDOW_MISSED"`, and a new cycle begins at Day 1.
4. **Day 7 Ultimate Completion**: When Day 7 is claimed, `cycle.currentDay` becomes `8`, `cycle.status` becomes `"COMPLETED"`, and `nextClaimAt` is cleared.

---

## 5. Wallet Credit & Transaction Lifecycle

Every reward claim updates the user's wallet balance and appends an immutable transaction record within a MongoDB multi-document transaction (`session.withTransaction`).

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant StreakRoute as /api/daily-streak/claim
    participant StreakService as streak.service.js
    participant DB as MongoDB Transaction Session

    User->>StreakRoute: POST /claim (Headers: Bearer <token>, Body: {})
    StreakRoute->>DB: AuditLog.create(STREAK_CLAIM_REQUEST)
    StreakRoute->>StreakService: claimCurrentReward(userId)

    activate StreakService
    StreakService->>DB: Start Session & withTransaction()
    StreakService->>DB: Load StreakConfig & Active StreakCycle
    StreakService->>StreakService: Validate eligibility (not locked, not expired)
    StreakService->>DB: Check existing StreakClaim (userId, cycleId, day)
    
    alt Claim already exists
        StreakService-->>User: 409 ALREADY_CLAIMED
    else Claim is eligible
        StreakService->>DB: StreakReward.findOne({ day: cycle.currentDay })
        StreakService->>DB: Wallet.findOne({ userId })
        StreakService->>DB: Wallet.updateOne(vesBalance or amazonGiftCardBalanceInr)
        StreakService->>DB: WalletTransaction.create(type: CREDIT, source: DAILY_STREAK, status: SUCCESS)
        StreakService->>DB: StreakClaim.create(claimId, cycleId, day, rewardId, txId)
        StreakService->>DB: StreakCycle.updateOne(currentStreak + 1, currentDay + 1, nextClaimAt)
        StreakService->>DB: AuditLog.create(STREAK_CLAIM_SUCCESS)
        StreakService->>DB: Commit Transaction
        StreakService-->>User: 200 OK { claimId, transactionId, reward }
    end
    deactivate StreakService
```

### Transaction Guarantees:
- **Atomicity**: If any operation fails (such as a database disconnection, write conflict, or schema violation), all changes—wallet balance increments, ledger entries, and streak updates—are rolled back completely.
- **Balance Integrity**: The `WalletTransaction` document records both `balanceBefore` and `balanceAfter` alongside the reference ID, ensuring an audit-proof ledger.

---

## 6. Duplicate & Concurrent Claim Prevention

To protect against duplicate claims and race conditions (e.g., automated scripts or double clicks across multiple tabs), the system employs defense-in-depth:

```mermaid
graph TD
    Req1[Claim Request A] --> LockCheck{Is Cooldown Active?}
    Req2[Claim Request B - Concurrent] --> LockCheck

    LockCheck -->|Yes| RejectLocked[409 STREAK_LOCKED]
    LockCheck -->|No| CheckExisting{Claim Exists in DB?}

    CheckExisting -->|Yes| RejectClaimed[409 ALREADY_CLAIMED]
    CheckExisting -->|No| MongoTx[MongoDB Multi-Document Transaction]

    MongoTx --> UniqueIndexCheck[Write StreakClaim with unique index:<br/>userId + cycleId + day]
    UniqueIndexCheck -->|First Request Wins| CommitTx[Commit Transaction & Credit Wallet]
    UniqueIndexCheck -->|Second Request Conflicted| E11000[MongoDB E11000 Duplicate Key Error]

    E11000 --> AbortTx[Abort Transaction & Rollback Wallet]
    AbortTx --> AuditRejection[Write AuditLog: DUPLICATE_CLAIM]
    AbortTx --> Reject409[409 ALREADY_CLAIMED]
```

### Idempotency Pillars:
1. **Compound Unique Index on Claims**:
   ```javascript
   streakClaimSchema.index({ userId: 1, cycleId: 1, day: 1 }, { unique: true });
   ```
2. **Partial Unique Index on Active Cycles**:
   ```javascript
   streakCycleSchema.index(
     { userId: 1, status: 1 },
     { unique: true, partialFilterExpression: { status: "ACTIVE" } }
   );
   ```
3. **Database Write Conflict Serialization**: When two requests run simultaneously inside `session.withTransaction`, MongoDB detects write conflicts or throws error code `11000`. The catch block intercepts `11000` and converts it into a clean `409 ALREADY_CLAIMED` response with zero double-crediting.
4. **Client-Side Throttling**: The frontend disables the claim button and displays "Processing..." during claim execution.

---

## 7. Error Handling Architecture

The backend standardizes all API errors through a centralized error handling middleware (`backend/src/middleware/error.middleware.js`):

### Custom `HttpError` Utility
Controllers and services throw structured `HttpError` instances:
```javascript
export class HttpError extends Error {
  constructor(status, message, code = "ERROR", details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
```

### Centralized Middleware Behavior:
- Intercepts uncaught errors and logs stack traces to `stderr`.
- Translates MongoDB `code === 11000` duplicate key errors directly to HTTP 409 `{ success: false, code: "DUPLICATE", message: "This operation has already been processed." }`.
- Conceals raw internal database errors or unhandled system exceptions in production by returning a safe HTTP 500 `"Unable to process your request. Please try again."`.
