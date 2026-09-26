# Database Documentation

## Collections

### User
Stores account identity and password hash.

### Wallet
One wallet per user. Tracks `vesBalance` and `amazonGiftCardBalanceInr`.

### StreakConfig
Backend configuration for total days, claim interval, claim window and reset behavior.

### StreakReward
Backend-driven reward configuration. The seeded seven-day configuration is:

| Day | Type | Currency | Amount |
|---|---|---|---:|
| 1 | VES | VES | 5 |
| 2 | VES | VES | 10 |
| 3 | VES | VES | 15 |
| 4 | Amazon Gift Card | INR | 1 |
| 5 | Amazon Gift Card | INR | 2 |
| 6 | VES | VES | 30 |
| 7 | Amazon Gift Card | INR | 5 |

### StreakCycle
Tracks each user's active/completed/reset 7-day cycle and the server-side timestamps used for eligibility.

An active-cycle partial unique index prevents multiple active cycles for one user.

### StreakClaim
Records each successful claim. The compound unique index on `userId + cycleId + day` prevents duplicate claims.

### WalletTransaction
Immutable-style ledger entry for each wallet credit/debit. Daily streak credits include the reward day and source.

### AuditLog
Records important events such as claim requests, successful claims, rejected claims, duplicate claims and resets.
