# API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require:

```text
Authorization: Bearer <JWT>
```

## Auth

### POST `/auth/register`

```json
{
  "name": "Demo User",
  "email": "demo@example.com",
  "password": "password123"
}
```

### POST `/auth/login`

```json
{
  "email": "demo@example.com",
  "password": "password123"
}
```

### GET `/auth/me`

Returns the authenticated user's identity.

## Daily Streak

### GET `/daily-streak`

Returns `serverTime`, current streak, current day, `nextClaimAt`, wallet-independent reward cards and backend-generated card states.

### GET `/daily-streak/status`

Same backend authority as the main streak endpoint. Useful for refreshing state when the countdown reaches zero.

### POST `/daily-streak/claim`

Requires authentication.

Request body:

```json
{}
```

No day, reward amount, currency or user ID is accepted from the client. The backend derives all authoritative values.

Possible business responses include:

- `200` — claim succeeded
- `400 UNTRUSTED_CLAIM_INPUT` — client tried to provide claim business values
- `401` — authentication failure
- `409 STREAK_LOCKED` — next claim time has not arrived
- `409 ALREADY_CLAIMED` — duplicate claim
- `409 PREVIOUS_DAY_MISSED` — previous day validation failed
- `409 CYCLE_COMPLETED` — seven-day cycle is complete

### GET `/daily-streak/history`

Returns the authenticated user's successful claim history with reward and transaction references.

## Wallet

### GET `/wallet`

Returns backend wallet balances.

### GET `/wallet/transactions`

Returns the wallet transaction ledger.

## Health

### GET `/health`

Returns API availability and service name. This endpoint is not under `/api`.
