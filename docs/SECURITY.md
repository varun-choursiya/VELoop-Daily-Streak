# Security & Business-Rule Notes

## Source of truth

React controls presentation only. The backend controls user identity, streak state, current day, eligibility, reward configuration, claim status, unlock timestamps, missed-day detection, reset behavior and wallet credits.

## Authentication

Daily Streak and wallet routes require a Bearer JWT. The authenticated user is derived from the JWT subject and loaded from MongoDB. Client-provided `userId` is not accepted for ownership.

## Claim API

`POST /api/daily-streak/claim` intentionally accepts an empty JSON object only. Day, reward, currency and user identity are not accepted from the client. Any non-empty claim payload receives `UNTRUSTED_CLAIM_INPUT`.

## Duplicate and concurrency protection

`StreakClaim` has a unique compound index on:

`userId + cycleId + day`

The wallet update, wallet transaction, claim creation, cycle update and success audit are executed in a MongoDB transaction. Duplicate/concurrent attempts are converted to a safe conflict response rather than a second wallet credit.

## Server time

The backend creates `serverTime` and `nextClaimAt`. The frontend countdown is display-only. Reaching zero triggers a fresh backend status request; the UI never grants eligibility locally.

## Missed-day reset

The current implementation documents an explicit interpretation of the brief:

- `claimIntervalHours = 24`
- `claimWindowHours = 24`
- `resetOnMissedDay = true`

This means the next reward unlocks 24 hours after the previous successful claim and remains claimable for the following 24 hours. A later request after the window resets the cycle.

## Environment secrets

Never commit `.env`. Use `.env.example`. MongoDB credentials and JWT secrets stay server-side.

## Production checklist

- Use a strong random `JWT_SECRET`.
- Restrict `CLIENT_URL` to the deployed frontend origin.
- Restrict MongoDB Atlas network access appropriately.
- Use HTTPS in production.
- Do not enable insecure TLS certificate bypasses.
- Keep rate limiting enabled.
- Review audit logs for suspicious claim activity.
