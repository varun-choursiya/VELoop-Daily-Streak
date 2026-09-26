# Testing & Acceptance Checklist

The project should be tested against the backend as the source of truth. Do not use frontend state or browser clock changes as proof of eligibility.

## Functional tests

- Register a new account.
- Login and load `/daily-streak`.
- Confirm Day 1 is `AVAILABLE` for a new user.
- Claim Day 1.
- Confirm wallet balance increases by 5 VES.
- Confirm a `StreakClaim`, `WalletTransaction`, and `STREAK_CLAIM_SUCCESS` audit entry exist in MongoDB.
- Refresh the page: Day 1 remains `CLAIMED` and Day 2 is locked with `nextClaimAt`.
- Logout/login: the same state is loaded from MongoDB.
- When the backend says the next claim is available, Day 2 becomes `AVAILABLE`.
- Continue through the 7-day configuration when the configured windows are reached.

## Security / anti-cheat tests

1. **Fake day:** send `{"day":7}` to `/claim`. The endpoint rejects any non-empty claim payload; the server chooses the current day.
2. **Fake reward:** send a fake amount/currency. The endpoint rejects the payload; reward data comes from `StreakReward`.
3. **Fake user:** send a different `userId`. The endpoint does not accept client ownership; identity comes from JWT.
4. **Fake streak:** send `{"streak":7}`. The payload is rejected and the backend never accepts a client streak value.
5. **Locked day:** call `/claim` before `nextClaimAt`; expect `STREAK_LOCKED`.
6. **Duplicate claim:** repeat the same claim; expect `ALREADY_CLAIMED` and no second wallet credit.
7. **Concurrent claim:** send two claim requests as close together as possible; only one may create the unique `(userId, cycleId, day)` claim and wallet credit.
8. **Timer manipulation:** change the device clock; the backend must continue using server time and `nextClaimAt`.
9. **Missed day:** allow the configured claim window to expire; next status/claim request must create a new active cycle at Day 1 and record `STREAK_RESET`.
10. **Multiple tabs:** claim in Tab A and attempt the same claim in Tab B; Tab B must not grant another reward.

## UI acceptance

- Branded initial loader.
- Theme-matched skeleton state.
- Desktop layout.
- Mobile layout.
- Tablet layout.
- Current/available state.
- Claimed state.
- Locked state.
- Missed/reset state.
- Backend-controlled countdown.
- CPA demo modal.
- Graceful API error state.
- Backend wallet balance.
- Recent claim history.

## Build

Frontend:

```bash
cd frontend
npm install
npm run build
```

Backend:

```bash
cd backend
npm install
npm run seed
npm run seed:demo
npm start
```

## Postman

Import:

`postman/VELoop-Daily-Streak.postman_collection.json`

Set the collection `baseUrl` and demo credentials, then run Login before protected requests.
