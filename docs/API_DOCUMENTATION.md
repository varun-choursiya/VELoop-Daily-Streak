
# VELoop Rewards — API Documentation

## 1. Project Overview

VELoop Rewards Daily Streak is a full-stack web application that allows authenticated users to claim daily rewards, track streak progress, view wallet balances, and access transaction history.

The application uses a React frontend, an Express.js backend, and MongoDB for persistent data storage.

## 2. Application URLs

| Component | URL |
|---|---|
| Frontend | https://ve-loop-daily-streak.vercel.app |
| Production API Origin | https://veloop-daily-streak-g4be.onrender.com |
| Production API Prefix | `/api` |
| Local API Origin | `http://localhost:5000` |
| Local API Prefix | `/api` |
| Health Check | `/health` |

### Base URL Convention

The API origin contains only the server domain. Endpoint paths include `/api` where applicable.

For example:

- Production login: `https://veloop-daily-streak-g4be.onrender.com/api/auth/login`
- Local login: `http://localhost:5000/api/auth/login`
- Production health check: `https://veloop-daily-streak-g4be.onrender.com/health`

Do not append `/api` twice.

## 3. Authentication

Protected endpoints require a valid JWT access token.

Include the following HTTP header:

```http
Authorization: Bearer <JWT_TOKEN>
```

The frontend stores the authentication token in `localStorage` using the key `veloop_token`. The API client attaches the token to requests through an Axios request interceptor.

The backend is responsible for verifying the token and identifying the authenticated user.

### Authentication Endpoints

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | Not required |
| POST | `/api/auth/login` | Authenticate a user | Not required |
| GET | `/api/auth/me` | Retrieve the authenticated user's information | Required |

### Example: Login Request

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

The documented login response structure is:

```json
{
  "success": true,
  "user": {
    "id": "USER_ID",
    "name": "Example User",
    "email": "user@example.com"
  },
  "token": "JWT_TOKEN"
}
```

The values above are illustrative. Actual values depend on the account and server response.

## 4. Daily Streak Endpoints

These endpoints provide streak information, claim eligibility, claim processing, and claim history.

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| GET | `/api/daily-streak` | Retrieve the daily streak overview and reward information | Required |
| GET | `/api/daily-streak/status` | Retrieve the current streak and claim status | Required |
| POST | `/api/daily-streak/claim` | Request a daily reward claim | Required |
| GET | `/api/daily-streak/history` | Retrieve the user's streak claim history | Required |

### Example: Get Daily Streak

```http
GET /api/daily-streak
Authorization: Bearer <JWT_TOKEN>
```

The response may contain streak information, reward details, the next eligible claim time, and wallet information, depending on the endpoint implementation.

### Example: Get Streak Status

```http
GET /api/daily-streak/status
Authorization: Bearer <JWT_TOKEN>
```

Use this endpoint to retrieve the current streak status from the backend rather than treating browser state as the source of truth.

### Example: Claim a Daily Reward

```http
POST /api/daily-streak/claim
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

```json
{}
```

The request body is empty in the current frontend API call.

The backend must validate authentication, claim eligibility, streak state, and applicable reward rules before processing a claim. The frontend must display the server's response rather than independently granting a reward.

A rejected claim may occur when a reward is locked, the user has already claimed, or another business rule prevents the claim. Exact response codes and error messages depend on the backend implementation.

### Example: Get Claim History

```http
GET /api/daily-streak/history
Authorization: Bearer <JWT_TOKEN>
```

This endpoint retrieves the authenticated user's streak claim history.

## 5. Wallet Endpoints

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| GET | `/api/wallet` | Retrieve wallet balances | Required |
| GET | `/api/wallet/transactions` | Retrieve wallet transaction history | Required |

### Example: Get Wallet

```http
GET /api/wallet
Authorization: Bearer <JWT_TOKEN>
```

An example response structure observed during development is:

```json
{
  "success": true,
  "wallet": {
    "vesBalance": 10,
    "amazonGiftCardBalanceInr": 0
  }
}
```

The balances shown are illustrative and are not guaranteed to match the current account.

### Example: Get Wallet Transactions

```http
GET /api/wallet/transactions
Authorization: Bearer <JWT_TOKEN>
```

The response provides transaction records associated with the authenticated user's wallet. Available fields depend on the actual API response.

## 6. Health Check

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| GET | `/health` | Check backend health | Not required, if configured as a public health route |

Example:

```http
GET /health
```

Expected behavior: the server responds with a successful health status when the route is available and the server is healthy.

The exact response body should be confirmed from the backend implementation.

## 7. HTTP Status Codes

The following codes are relevant to the documented API behavior. The exact code returned depends on the route and error condition.

| Status Code | Meaning |
|---|---|
| `200 OK` | Request completed successfully |
| `201 Created` | Resource created successfully, where applicable |
| `400 Bad Request` | Request data is invalid or malformed |
| `401 Unauthorized` | Authentication is missing or invalid |
| `403 Forbidden` | Request is not permitted, if this status is used by the route |
| `404 Not Found` | Requested route or resource was not found |
| `409 Conflict` | Request conflicts with the current state, such as a locked or already-claimed reward |
| `429 Too Many Requests` | Rate limit exceeded, if rate limiting is configured |
| `500 Internal Server Error` | Unexpected server error |

These codes describe common API conventions and documented development observations; they are not a guarantee that every endpoint uses every code.

## 8. Security and Business Rules

### Server-Side Validation

The backend must remain authoritative for user identity, streak state, claim eligibility, reward amounts, and wallet changes.

The frontend must not be trusted to determine whether a reward can be claimed or how much value should be credited.

### Authentication

Protected routes use JWT-based authentication. The backend verifies the supplied token before allowing access to protected user data.

JWT implementation details, token expiration, signing configuration, and middleware behavior should be verified against the current backend source code.

### Token Storage

The current frontend implementation stores the JWT in browser `localStorage` and attaches it to requests through an Axios interceptor.

JavaScript-accessible token storage has security trade-offs, particularly if cross-site scripting vulnerabilities occur. HttpOnly cookie-based authentication is an alternative that may be evaluated separately; it should not be described as implemented unless the application is actually changed to use it.

### Duplicate Claims

The backend should reject claims that are not eligible under the current streak rules.

Database constraints, transaction handling, and concurrency behavior must be verified against the actual source code and tested under concurrent requests before claiming that all race conditions are prevented.

### Wallet Integrity

Wallet balances and transaction records should be updated by trusted backend logic. The frontend must not directly set a user's authoritative balance.

### Rate Limiting

Rate limiting should only be documented as active after the relevant middleware and its configuration have been verified in the backend source code.

## 9. Environment Configuration

### Frontend

The frontend uses the `VITE_API_URL` environment variable when configured.

Example:

```env
VITE_API_URL=https://veloop-daily-streak-g4be.onrender.com/api
```

For local development:

```env
VITE_API_URL=http://localhost:5000/api
```

The frontend API client must not append another `/api` if the configured URL already includes that prefix.

### Backend

Backend environment variables depend on the current server configuration. Consult the backend `.env.example` and configuration files for the exact required variable names.

Never commit real secrets, database credentials, JWT signing secrets, or production credentials to GitHub.

## 10. Production Verification

The frontend is deployed at:

https://ve-loop-daily-streak.vercel.app

The backend is configured at:

https://veloop-daily-streak-g4be.onrender.com

Deployment URLs alone do not prove that every endpoint is functioning correctly in production. Verify authentication, CORS, streak status, claim processing, wallet balances, and transaction history against the deployed backend before marking the complete production API as tested.

## 11. API Documentation Maintenance

When the API changes:

1. Verify the route and HTTP method in the backend source code.
2. Confirm request and response structures from actual responses.
3. Update authentication requirements and status codes.
4. Update environment variable examples if configuration changes.
5. Test the documented endpoint before marking it verified.
6. Keep example credentials and tokens fictional or explicitly test-only.