
# VELoop Rewards — Database Documentation

## 1. Overview

VELoop Rewards Daily Streak uses MongoDB as its database.

The backend uses Node.js and Express.js to process application requests, and Mongoose is used where configured for MongoDB integration.

The database supports the application's user accounts, daily streak state, reward claims, wallet balances, and transaction history.

This document describes the logical data requirements and database behavior. Actual collection names, model fields, schema validation, and indexes must be confirmed against the current backend model files.

## 2. Database Technology

| Property | Description |
|---|---|
| Database | MongoDB |
| Backend runtime | Node.js |
| API framework | Express.js |
| Database integration | Mongoose, where configured |
| Database connection | Backend environment configuration |
| Production backend | Render |

The MongoDB connection URI must be stored in backend environment configuration and must not be committed to the repository.

## 3. Logical Data Model

The application needs to manage several categories of data:

```text
User
 |
 +---- Streak State / Cycle
 |          |
 |          +---- Reward Claims
 |
 +---- Wallet
 |        |
 |        +---- Wallet Transactions
 |
 +---- Claim History
```

This diagram represents logical relationships, not a guarantee of the exact MongoDB collection structure. MongoDB documents may embed related data or reference separate documents depending on the actual implementation.

## 4. User Data

The user data layer supports registration, authentication, and identification of the authenticated account.

Typical logical fields may include:

| Field | Purpose |
|---|---|
| User ID | Unique identifier for the account |
| Name | User's display name, if collected |
| Email | Account email address |
| Password hash | Securely stored password hash |
| Created timestamp | Account creation time, if recorded |
| Updated timestamp | Last update time, if recorded |

These are logical examples. The actual schema may use different field names or omit some fields.

### User Data Requirements

- Each account must have a stable identifier.
- Email uniqueness should be enforced according to the application's registration rules.
- Passwords must not be stored in plaintext.
- Password hashes must not be returned by public API endpoints.
- Private account data must be associated with the authenticated user.

The exact field names, validators, and unique indexes must be checked in the User model.

## 5. Streak Data

The streak data layer stores or supports calculation of a user's progress through the daily reward cycle.

The application needs to determine:

- Current streak.
- Current reward day.
- Whether a claim has already been made.
- Whether the next claim is eligible.
- The next eligible claim time.
- Whether the streak must reset.
- Applicable reward information.
- Claim history.

Depending on the implementation, these values may be stored directly, derived from claim records, or calculated using a combination of stored data and server time.

### Logical Streak Fields

| Field | Purpose |
|---|---|
| User reference | Associates streak data with a user |
| Current streak | Consecutive progress, if stored |
| Current day | Current position in the reward cycle, if stored |
| Last claim timestamp | Supports claim eligibility calculations, if stored |
| Next eligible timestamp | Represents the next eligible claim time, if stored |
| Status | Current streak status, if stored |
| Cycle identifier | Identifies a streak cycle, if used |

These fields describe possible logical data. They are not a claim that every field exists in the current schema.

## 6. Reward Configuration

Reward configuration determines which reward is associated with a particular day.

Logical reward properties may include:

| Property | Purpose |
|---|---|
| Day | Reward day within the cycle |
| Reward type | Type of reward |
| Currency | Reward currency, where applicable |
| Amount | Configured reward value |
| Title | Display title |
| Active status | Whether the reward is available |
| Metadata | Additional reward information, if needed |

The actual implementation may store reward definitions in a dedicated collection, another model, or application configuration.

The backend should validate the applicable reward amount and type rather than trusting values submitted by the frontend.

## 7. Streak Claims and History

Claim data records the result of a reward claim.

Logical properties may include:

| Property | Purpose |
|---|---|
| Claim ID | Identifier for a claim |
| User reference | Identifies the claiming user |
| Cycle reference | Identifies the reward cycle, if used |
| Reward day | Day associated with the claim |
| Claim timestamp | Time at which the claim was recorded |
| Claim status | Result of the claim |
| Transaction reference | Associated wallet transaction, if applicable |

Actual field names and status values must be verified in the corresponding model and service files.

### Duplicate-Claim Protection

A database uniqueness constraint can be used to prevent duplicate claims when designed around the application's actual claim rules.

For example, a unique key based on user and cycle may be appropriate if the business rules permit only one claim per day within a cycle. The exact index must match the real data model and reset behavior.

Do not assume such an index exists without inspecting the model definitions and database indexes.

## 8. Wallet Data

The wallet layer represents a user's available reward balances.

An example wallet response observed during development was:

```json
{
  "success": true,
  "wallet": {
    "vesBalance": 10,
    "amazonGiftCardBalanceInr": 0
  }
}
```

These values are illustrative and may change with subsequent claims.

The actual wallet model may contain additional fields or represent balances differently.

### Wallet Requirements

- Wallet data must be associated with the correct user.
- The backend must control authoritative balances.
- Reward credits must follow validated business rules.
- Client-supplied balances must not be accepted as authoritative.
- Updates must be consistent with the associated claim and transaction records.

## 9. Wallet Transactions

Wallet transactions record changes to wallet balances.

A transaction record may logically include:

| Property | Purpose |
|---|---|
| Transaction ID | Identifies the transaction |
| User reference | Associates the transaction with an account |
| Currency | Currency or reward unit |
| Transaction type | Credit or debit, where applicable |
| Amount | Value of the transaction |
| Source | Reason for the transaction |
| Balance before | Previous balance, if recorded |
| Balance after | Resulting balance, if recorded |
| Status | Transaction processing result |
| Created timestamp | Transaction creation time |

These are descriptive examples, not a verified copy of the current schema.

The wallet transaction endpoint is:

```http
GET /api/wallet/transactions
```

The endpoint should return records belonging to the authenticated user.

## 10. Database Relationships

The following logical relationships apply to the application's data requirements:

- A user owns their account data.
- A user has associated streak progress.
- A user's reward claims are associated with their streak activity.
- A user has associated wallet balances.
- Wallet transactions record wallet-related activity.
- A successful reward claim may reference its associated transaction.

Whether these relationships use MongoDB references, embedded documents, or another structure depends on the current model implementation.

## 11. Database Indexes

Indexes can support query performance and data integrity.

Potential index requirements include:

- Unique email index, if email uniqueness is enforced at the database level.
- User reference indexes for account-specific queries.
- Timestamp indexes for ordered history queries, where useful.
- Unique claim constraints that match the application's actual business rules.
- Transaction identifier uniqueness, if transaction IDs must be unique.

The actual indexes must be inspected in the Mongoose schema definitions and, where necessary, in the MongoDB database itself.

A schema declaration alone does not always prove that a corresponding index has been created successfully in the deployed database.

## 12. Claim Processing and Data Consistency

A successful claim may involve multiple related operations:

1. Validate the authenticated user.
2. Check streak and claim eligibility.
3. Determine the applicable reward.
4. Record the claim.
5. Update the relevant wallet balance.
6. Record the wallet transaction.
7. Return the updated application state.

These operations must be designed to avoid inconsistent outcomes, such as a reward being credited without a corresponding valid claim.

MongoDB transactions or other atomic mechanisms may be used when supported by the deployment and implemented correctly.

The exact transaction strategy and rollback behavior must be verified in the backend source code and tested against the configured database.

## 13. Database Time and Streak Rules

Streak eligibility depends on reliable claim timestamps and server-side business rules.

The backend should determine eligibility using its authoritative logic rather than trusting a browser-provided clock or a client-supplied current day.

The database may store timestamps that the backend uses to calculate the next eligible claim time or detect missed days.

Exact interval calculations, timezone handling, and reset behavior must follow the current implementation and should be tested with controlled timestamps.

## 14. Environment Configuration

The database connection string should be supplied through backend environment configuration.

Example placeholder:

```env
MONGODB_URI=replace_with_your_mongodb_connection_uri
```

`MONGODB_URI` is an example variable name. Confirm the actual name used by the backend configuration.

### Security Requirements

- Do not commit a real database URI to GitHub.
- Restrict database access to authorized clients and services.
- Use appropriate database credentials and permissions.
- Keep production and development configurations separate where applicable.
- Do not print credentials in application logs.
- Use a managed backup and recovery approach appropriate to the deployment.

## 15. Database Testing

Recommended database checks include:

- [ ] A new user can be registered according to the application's rules.
- [ ] Duplicate registration is handled correctly.
- [ ] User-specific data is isolated between accounts.
- [ ] Streak data persists after refreshing the page.
- [ ] Successful claims create the expected records.
- [ ] Rejected claims do not incorrectly credit rewards.
- [ ] Wallet balances match the corresponding transaction history.
- [ ] Duplicate claim behavior is verified.
- [ ] Concurrent claim behavior is tested.
- [ ] Indexes are present where required.
- [ ] Database errors are handled without exposing secrets.

Only mark a check as passed after performing the test and observing the result.

## 16. Backup and Recovery

Production database backup and recovery should be configured according to the database hosting plan and the project's operational requirements.

Recommended practices include:

- Maintain appropriate backups.
- Restrict access to backups.
- Avoid including credentials in backup documentation.
- Document the recovery process.
- Test recovery procedures where practical.

Backup configuration and recovery testing should be documented only after they have been performed.

## 17. Schema Maintenance

When changing database models:

1. Review dependent services and API endpoints.
2. Update validation and index definitions.
3. Consider existing records and backward compatibility.
4. Test registration, claims, wallet updates, and history queries.
5. Update this document to reflect the actual schema.
6. Verify the production database separately from local development.

## 18. Documentation Limitations

This document describes the logical database responsibilities of VELoop Rewards. It does not replace the actual Mongoose schema definitions or a database inspection.

For an exact schema reference, verify the current model files, index definitions, and relevant service logic before documenting specific collection names, field types, defaults, or constraints.