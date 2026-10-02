# API Documentation

> **Note**: For the full, exhaustive endpoint specification including live payload schemas, error status tables, and validation rules, see **[docs/API.md](API.md)**.

Local Base URL: `http://localhost:5000/api`.

Production Base URL: `https://veloop-daily-streak-g4be.onrender.com/api`

Frontend URL: `https://ve-loop-daily-streak.vercel.app`

All protected endpoints require:

```text
Authorization: Bearer <JWT>
```

## Quick Reference

### Auth
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`)
- `POST /api/auth/login` — Authenticate and receive JWT
- `GET /api/auth/me` — Return current authenticated user profile

### Daily Streak
- `GET /api/daily-streak` — Authoritative streak status, rewards, and server time
- `GET /api/daily-streak/status` — Live status endpoint for live countdown refresh
- `POST /api/daily-streak/claim` — Claim the current eligible reward (body must be `{}`)
- `GET /api/daily-streak/history` — List authenticated user's claim history

### Wallet
- `GET /api/wallet` — Retrieve VES and Amazon gift card balances
- `GET /api/wallet/transactions` — Retrieve immutable transaction ledger

### System
- `GET /health` — Service health check (root route, outside `/api`)
