# VELoop Rewards — API Documentation

This document provides a comprehensive, verified specification of every API endpoint available in the **VELoop Rewards — Daily Streak** backend.

---

## 1. Global API Information

- **Base URL (Local)**: `http://localhost:5000/api`
- **Production Base URL**:` https://veloop-daily-streak-g4be.onrender.com/api`
- **Frontend URL**:` https://ve-loop-daily-streak.vercel.app`
- **Health Check URL**: `http://localhost:5000/health` (Root route, outside `/api`)
- **Protocol**: HTTP/1.1 (TLS 1.3 recommended in production)
- **Data Format**: `application/json` (Request bodies limited to 20 KB)
- **Time Representation**: All timestamps are formatted as ISO 8601 strings in UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).

---

## 2. Authentication & Authorization

Protected endpoints require a JSON Web Token (JWT) transmitted via the standard HTTP `Authorization` header:

```http
Authorization: Bearer <token>
```

### JWT Specifications
- **Algorithm**: HMAC-SHA256 (`HS256`) explicitly enforced during verification.
- **Payload Subject (`sub`)**: The user's 24-character hexadecimal MongoDB `ObjectId`.
- **Default Lifespan**: 7 days (`7d`), configurable via `JWT_EXPIRES_IN`.
- **Clock Tolerance**: Evaluated with standard jsonwebtoken verification.

### Authentication Errors (HTTP 401)
When token extraction or verification fails, the server responds with HTTP 401:

| Error Code | HTTP Status | Trigger Condition | Response Body |
|---|---|---|---|
| `AUTH_REQUIRED` | 401 | Missing `Authorization` header or missing Bearer token | `{"success":false,"code":"AUTH_REQUIRED","message":"Please log in to continue."}` |
| `AUTH_INVALID` | 401 | Malformed token, signature mismatch, or non-existent user | `{"success":false,"code":"AUTH_INVALID","message":"Please log in to continue."}` |
| `AUTH_EXPIRED` | 401 | Token expiration timestamp (`exp`) is in the past | `{"success":false,"code":"AUTH_EXPIRED","message":"Session expired. Please log in again."}` |

---

## 3. Rate Limiting Policies

The backend enforces multi-tiered rate limiting using `express-rate-limit`:

| Route Pattern | Window Duration | Max Requests | Headers Returned | Response on Limit Exceeded |
|---|---|---|---|---|
| `/api/*` (Global) | 15 minutes (`900000ms`) | 300 requests | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` | `429 Too Many Requests` |
| `/api/auth/register` | 15 minutes (`900000ms`) | 15 attempts | Standard rate limit headers | `{"success":false,"code":"TOO_MANY_REQUESTS","message":"Too many authentication attempts. Please try again after 15 minutes."}` |
| `/api/auth/login` | 15 minutes (`900000ms`) | 15 attempts | Standard rate limit headers | `{"success":false,"code":"TOO_MANY_REQUESTS","message":"Too many authentication attempts. Please try again after 15 minutes."}` |
| `/api/daily-streak/claim` | 1 minute (`60000ms`) | 10 attempts | Standard rate limit headers | `{"success":false,"code":"TOO_MANY_REQUESTS","message":"Too many claim attempts. Please wait a minute before trying again."}` |

---

## 4. Endpoints Specification

### 4.1 System & Health

#### GET `/health`
Returns service availability. Does not require authentication or rate limiting.

- **Method**: `GET`
- **URL**: `http://localhost:5000/health`
- **Auth Required**: No
- **Headers**: None required

##### Success Response (`200 OK`)
```json
{
  "success": true,
  "service": "veloop-daily-streak-api"
}
```

---

### 4.2 Authentication (`/api/auth`)

#### POST `/api/auth/register`
Creates a new user account, initializes an empty wallet, and issues an authentication JWT.

- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Auth Required**: No
- **Rate Limit**: 15 requests per 15 minutes per IP

##### Request Body
```json
{
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "password": "Password123"
}
```

##### Validation Rules (`express-validator`)
- `name`: String, trimmed, length between 2 and 80 characters.
- `email`: Valid email format, automatically normalized to lowercase.
- `password`: String, length between 8 and 128 characters.

##### Success Response (`201 Created`)
```json
{
  "success": true,
  "user": {
    "id": "6ab7d250b541ab1bbdac1275",
    "name": "Alex Johnson",
    "email": "alex@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

##### Error Responses
- **`400 VALIDATION_ERROR`** (Input violates validation rules):
  ```json
  {
    "success": false,
    "code": "VALIDATION_ERROR",
    "message": "Please provide valid account details.",
    "details": [
      {
        "type": "field",
        "value": "a",
        "msg": "Invalid value",
        "path": "name",
        "location": "body"
      }
    ]
  }
  ```
- **`409 EMAIL_EXISTS`** (Email already registered):
  ```json
  {
    "success": false,
    "code": "EMAIL_EXISTS",
    "message": "An account with this email already exists."
  }
  ```

---

#### POST `/api/auth/login`
Authenticates user credentials using constant-time comparison against a dummy bcrypt hash on email misses, preventing timing attacks.

- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Auth Required**: No
- **Rate Limit**: 15 requests per 15 minutes per IP

##### Request Body
```json
{
  "email": "alex@example.com",
  "password": "Password123"
}
```

##### Validation Rules
- `email`: Valid email format, automatically normalized to lowercase.
- `password`: String, length between 1 and 128 characters.

##### Success Response (`200 OK`)
```json
{
  "success": true,
  "user": {
    "id": "6ab7d250b541ab1bbdac1275",
    "name": "Alex Johnson",
    "email": "alex@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

##### Error Responses
- **`400 VALIDATION_ERROR`**: Invalid email structure or empty password.
- **`401 INVALID_CREDENTIALS`**:
  ```json
  {
    "success": false,
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password."
  }
  ```

---

#### GET `/api/auth/me`
Retrieves the profile of the currently authenticated user.

- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Auth Required**: Yes (`Bearer <token>`)

##### Success Response (`200 OK`)
```json
{
  "success": true,
  "user": {
    "id": "6ab7d250b541ab1bbdac1275",
    "name": "Alex Johnson",
    "email": "alex@example.com"
  }
}
```

---

### 4.3 Daily Streak (`/api/daily-streak`)

#### GET `/api/daily-streak`
Retrieves the authoritative daily streak status, active cycle information, countdown timers, backend wallet balances, and the complete 7-day reward configuration with calculated statuses.

- **Method**: `GET`
- **URL**: `/api/daily-streak`
- **Auth Required**: Yes (`Bearer <token>`)

##### Success Response (`200 OK`)
```json
{
  "success": true,
  "serverTime": "2026-10-02T04:59:06.980Z",
  "wallet": {
    "vesBalance": 15,
    "amazonGiftCardBalanceInr": 0
  },
  "streak": {
    "currentStreak": 1,
    "currentDay": 2,
    "checkedIn": 1,
    "totalRewards": 7,
    "status": "ACTIVE",
    "nextClaimAt": "2026-10-03T02:53:45.843Z",
    "wasReset": false,
    "resetReason": null
  },
  "nextReward": {
    "day": 2,
    "type": "VES",
    "currency": "VES",
    "amount": 10,
    "title": "Daily Reward",
    "subtitle": "10 VEs",
    "assetType": "coin"
  },
  "ultimateReward": {
    "day": 7,
    "type": "AMAZON_GIFT_CARD",
    "currency": "INR",
    "amount": 5,
    "title": "Ultimate Reward",
    "subtitle": "₹5 Amazon Gift Card",
    "assetType": "crown"
  },
  "rewards": [
    {
      "day": 1,
      "status": "CLAIMED",
      "reward": {
        "type": "VES",
        "currency": "VES",
        "amount": 5,
        "title": "Daily Reward",
        "subtitle": "5 VEs",
        "assetType": "coin"
      }
    },
    {
      "day": 2,
      "status": "LOCKED",
      "reward": {
        "type": "VES",
        "currency": "VES",
        "amount": 10,
        "title": "Daily Reward",
        "subtitle": "10 VEs",
        "assetType": "coin"
      },
      "nextClaimAt": "2026-10-03T02:53:45.843Z"
    },
    {
      "day": 3,
      "status": "LOCKED",
      "reward": {
        "type": "VES",
        "currency": "VES",
        "amount": 15,
        "title": "Daily Reward",
        "subtitle": "15 VEs",
        "assetType": "coin"
      }
    },
    {
      "day": 4,
      "status": "LOCKED",
      "reward": {
        "type": "AMAZON_GIFT_CARD",
        "currency": "INR",
        "amount": 1,
        "title": "Amazon Gift Card",
        "subtitle": "₹1 Amazon Gift Card",
        "assetType": "gift-card"
      }
    },
    {
      "day": 5,
      "status": "LOCKED",
      "reward": {
        "type": "AMAZON_GIFT_CARD",
        "currency": "INR",
        "amount": 2,
        "title": "Amazon Gift Card",
        "subtitle": "₹2 Amazon Gift Card",
        "assetType": "gift-card"
      }
    },
    {
      "day": 6,
      "status": "LOCKED",
      "reward": {
        "type": "VES",
        "currency": "VES",
        "amount": 30,
        "title": "Daily Reward",
        "subtitle": "30 VEs",
        "assetType": "coin"
      }
    },
    {
      "day": 7,
      "status": "LOCKED",
      "reward": {
        "type": "AMAZON_GIFT_CARD",
        "currency": "INR",
        "amount": 5,
        "title": "Ultimate Reward",
        "subtitle": "₹5 Amazon Gift Card",
        "assetType": "crown"
      }
    }
  ],
  "user": {
    "name": "Alex Johnson",
    "email": "alex@example.com"
  }
}
```

##### Card Status Enumeration
Each item in `rewards` has a `status` computed by the server:
- `AVAILABLE`: Eligible to be claimed right now.
- `CLAIMED`: Successfully claimed in the current cycle.
- `LOCKED`: Upcoming day that is not yet unlocked or waiting on countdown.
- `MISSED`: Past day that was not claimed within the allowed window.

---

#### GET `/api/daily-streak/status`
Returns an identical payload to `GET /api/daily-streak`. This endpoint is designed for lightweight polling and countdown completion triggers.

- **Method**: `GET`
- **URL**: `/api/daily-streak/status`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response**: Same as `GET /api/daily-streak`

---

#### POST `/api/daily-streak/claim`
Claims the reward for the currently eligible day. Executes within a MongoDB ACID multi-document transaction.

- **Method**: `POST`
- **URL**: `/api/daily-streak/claim`
- **Auth Required**: Yes (`Bearer <token>`)
- **Rate Limit**: 10 requests per minute
- **Body Requirement**: Strictly **empty object (`{}`)**. Any keys in `req.body` or query parameters trigger an immediate 400 rejection.

##### Security Rule: Parameter Tampering Rejection
Clients **cannot** supply `day`, `amount`, `currency`, `reward`, or `userId`. All values are derived entirely from server state and database models.

```json
{}
```

##### Success Response (`200 OK`)
```json
{
  "success": true,
  "claimId": "CLAIM-E7FE07CB6D8D2AFA",
  "transactionId": "STREAK-7F37D6C253402D77",
  "reward": {
    "day": 1,
    "type": "VES",
    "currency": "VES",
    "amount": 5
  }
}
```

##### Error Responses
- **`400 UNTRUSTED_CLAIM_INPUT`** (Client provided body or query parameters):
  ```json
  {
    "success": false,
    "code": "UNTRUSTED_CLAIM_INPUT",
    "message": "Claim day, reward and user identity are strictly controlled by the server."
  }
  ```
- **`409 STREAK_LOCKED`** (Attempted claim before cooldown expired):
  ```json
  {
    "success": false,
    "code": "STREAK_LOCKED",
    "message": "Your next reward is not available yet.",
    "details": {
      "nextClaimAt": "2026-10-03T02:53:45.843Z"
    }
  }
  ```
- **`409 ALREADY_CLAIMED`** (Attempted duplicate claim for the current day):
  ```json
  {
    "success": false,
    "code": "ALREADY_CLAIMED",
    "message": "This reward has already been claimed."
  }
  ```
- **`409 PREVIOUS_DAY_MISSED`** (Previous day claim is missing from database):
  ```json
  {
    "success": false,
    "code": "PREVIOUS_DAY_MISSED",
    "message": "Your streak has been reset. Start again from Day 1."
  }
  ```
- **`409 CYCLE_COMPLETED`** (All 7 days of the streak cycle have been claimed):
  ```json
  {
    "success": false,
    "code": "CYCLE_COMPLETED",
    "message": "This streak cycle is complete."
  }
  ```

---

#### GET `/api/daily-streak/history`
Returns the authenticated user's claim history sorted in reverse chronological order (newest first).

- **Method**: `GET`
- **URL**: `/api/daily-streak/history`
- **Auth Required**: Yes (`Bearer <token>`)

##### Success Response (`200 OK`)
```json
{
  "success": true,
  "history": [
    {
      "_id": "6abf1cbad984dc720c2c185d",
      "claimId": "CLAIM-E7FE07CB6D8D2AFA",
      "userId": "6ab7d250b541ab1bbdac1275",
      "cycleId": "6abf1cb2d984dc720c2c1842",
      "day": 1,
      "rewardId": {
        "_id": "6ab6718138033a726fe512b5",
        "day": 1,
        "amount": 5,
        "currency": "VES",
        "rewardType": "VES",
        "subtitle": "5 VEs",
        "title": "Daily Reward"
      },
      "status": "SUCCESS",
      "claimedAt": "2026-10-02T02:53:45.843Z",
      "transactionId": {
        "_id": "6abf1cbad984dc720c2c185b",
        "transactionId": "STREAK-7F37D6C253402D77",
        "userId": "6ab7d250b541ab1bbdac1275",
        "currency": "VES",
        "type": "CREDIT",
        "amount": 5,
        "source": "DAILY_STREAK",
        "referenceId": "STREAK-7F37D6C253402D77",
        "streakDay": 1,
        "balanceBefore": 10,
        "balanceAfter": 15,
        "status": "SUCCESS",
        "createdAt": "2026-10-02T02:53:46.084Z",
        "updatedAt": "2026-10-02T02:53:46.084Z"
      },
      "createdAt": "2026-10-02T02:53:46.121Z",
      "updatedAt": "2026-10-02T02:53:46.121Z"
    }
  ]
}
```

---

### 4.4 Wallet (`/api/wallet`)

#### GET `/api/wallet`
Returns the authoritative balances for both reward currencies (VES points and Amazon Gift Card INR balance).

- **Method**: `GET`
- **URL**: `/api/wallet`
- **Auth Required**: Yes (`Bearer <token>`)

##### Success Response (`200 OK`)
```json
{
  "success": true,
  "wallet": {
    "vesBalance": 15,
    "amazonGiftCardBalanceInr": 0
  }
}
```

---

#### GET `/api/wallet/transactions`
Returns the immutable wallet transaction ledger for the authenticated user, sorted newest first (`createdAt: -1`).

- **Method**: `GET`
- **URL**: `/api/wallet/transactions`
- **Auth Required**: Yes (`Bearer <token>`)

##### Success Response (`200 OK`)
```json
{
  "success": true,
  "transactions": [
    {
      "_id": "6abf1cbad984dc720c2c185b",
      "transactionId": "STREAK-7F37D6C253402D77",
      "userId": "6ab7d250b541ab1bbdac1275",
      "currency": "VES",
      "type": "CREDIT",
      "amount": 5,
      "source": "DAILY_STREAK",
      "referenceId": "STREAK-7F37D6C253402D77",
      "streakDay": 1,
      "balanceBefore": 10,
      "balanceAfter": 15,
      "status": "SUCCESS",
      "createdAt": "2026-10-02T02:53:46.084Z",
      "updatedAt": "2026-10-02T02:53:46.084Z"
    }
  ]
}
```

---

### 4.5 Fallback & Unknown Routes

#### Catch-All Route (`*`)
Any request matching an undefined path returns an HTTP 404 response.

##### Response (`404 Not Found`)
```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Route not found."
}
```
