# Security & Business-Rule Notes

## Source of Truth & Inspect Mode Protection

React and the browser DOM control presentation only. A user cannot bypass rules or claim rewards through DevTools ("Inspect Element" or JavaScript console):
- **No Client Authority**: The claim endpoint (`POST /api/daily-streak/claim`) does not accept `day`, `reward`, `amount`, `currency`, or `userId` from the client.
- **Payload Strictness**: Any claim request with a body or query parameters receives `400 UNTRUSTED_CLAIM_INPUT`.
- **Server-Driven Calculation**: Current day, reward amount, unlock timestamps, and eligibility are retrieved directly from MongoDB.
- **Server Clock Authority**: The frontend countdown is cosmetic only. Changing system time or manipulating countdown timers does not unlock rewards because the backend evaluates eligibility against the authoritative server timestamp.
- **Local State Tampering Resistance**: Modifying React component state, local storage, or DOM attributes (such as removing `disabled` from buttons) simply triggers an API call that the backend rejects with `409 STREAK_LOCKED` or `409 ALREADY_CLAIMED`.

## JWT & Authentication Security

- **Cryptographic Binding**: All authenticated routes require a `Bearer <token>` signed with HMAC-SHA256 (`HS256`).
- **Algorithm Enforcement**: The authentication middleware explicitly enforces `{ algorithms: ["HS256"] }` in `jwt.verify` to eliminate algorithm confusion attacks.
- **Subject Validation**: The token `sub` is strictly validated as a valid MongoDB ObjectId before querying the database.
- **Clear Expiry Distinction**: Tokens that have expired return `AUTH_EXPIRED` so clients can re-authenticate cleanly.
- **Secret Hygiene**: The server verifies that `JWT_SECRET` is defined at boot and issues warnings if it is under 32 characters (256 bits).
- **Anti-Timing Attack**: The login service utilizes constant-time comparison against a dummy bcrypt hash when an email does not exist, eliminating timing-based user enumeration.

## Rate Limiting & Abuse Prevention

- **Global API Limiter**: 300 requests per 15-minute window for standard navigation and reads.
- **Auth Endpoint Limiter**: 15 requests per 15-minute window on `/api/auth/login` and `/api/auth/register` to block brute-force attacks and automated registration spam.
- **Claim Endpoint Limiter**: 10 requests per minute on `/api/daily-streak/claim` to prevent transaction storming and database log flooding.

## Duplicate and Concurrency Protection

`StreakClaim` has a unique compound index on:

`userId + cycleId + day`

The wallet balance update, wallet transaction, claim creation, cycle update, and audit log entries are executed within a MongoDB multi-document transaction (`session.withTransaction`). Concurrent requests are serialized, and duplicate attempts trigger a clean conflict rollback (`ALREADY_CLAIMED`).

## Missed-Day Reset

The business rules enforce:
- `claimIntervalHours = 24`
- `claimWindowHours = 24`
- `resetOnMissedDay = true`

The next reward unlocks 24 hours after the previous successful claim and remains claimable for the following 24 hours. A request after this window resets the cycle to Day 1 and logs a `STREAK_RESET` event.

## Production Checklist

- Use a cryptographically secure random `JWT_SECRET` (at least 32 bytes / 64 hex characters).
- Store JWT tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies in production web applications.
- Restrict `CLIENT_URL` to the exact deployed frontend origin.
- Restrict MongoDB Atlas network access to application server IP addresses.
- Enforce HTTPS and TLS 1.3 in production environments.
- Review audit logs for suspicious or repeated claim rejections.

