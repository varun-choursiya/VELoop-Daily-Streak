
# VELoop Rewards — Security Documentation

## 1. Overview

VELoop Rewards Daily Streak is a full-stack web application with user authentication, daily reward claims, wallet balances, and transaction history.

Security is important because users must only access their own account data, and rewards must not be granted through unauthorized or manipulated requests.

This document describes the security approach and the checks required to verify the implementation. A documented recommendation must not be treated as proof that a security control has been implemented or independently audited.

## 2. Application Security Boundaries

The application consists of:

- React frontend hosted on Vercel.
- Express.js backend hosted on Render.
- MongoDB database.
- JWT-based authentication.
- API requests between the frontend and backend.

Production URLs:

- Frontend: https://ve-loop-daily-streak.vercel.app
- Backend: https://veloop-daily-streak-g4be.onrender.com

The frontend is a user interface and must not be trusted as the authority for authentication, reward eligibility, or wallet balances.

## 3. Authentication

The application uses JSON Web Tokens (JWT) for authentication.

After successful login, the frontend receives a token and uses it for protected API requests.

The frontend currently stores the token in browser `localStorage` under the key:

```text
veloop_token
```

Protected requests include the following header:

```http
Authorization: Bearer <JWT_TOKEN>
```

The backend must validate the token before granting access to protected resources.

### Authentication Requirements

- Reject protected requests with missing or invalid tokens.
- Validate the authenticated user's identity on the server.
- Do not accept a user identity supplied by the client as proof of authorization.
- Return appropriate errors for unauthorized requests.
- Clear the frontend authentication state when the user logs out.
- Never expose passwords, JWT signing secrets, or database credentials in API responses.

JWT signing algorithm, expiration settings, and token validation details should be confirmed against the current backend source code.

## 4. Authorization and User Data Isolation

Authentication identifies the user. Authorization determines which resources that user may access.

For every protected operation, the backend should derive the user identity from the validated authentication context.

Examples include:

- Daily streak status.
- Daily reward claims.
- Wallet balances.
- Wallet transaction history.
- Streak claim history.
- Account information.

A user must not be able to access another user's wallet or claim history by changing an ID in a URL, query parameter, or request body.

### Verification

Test protected endpoints with:

1. No authentication token.
2. An invalid token.
3. A valid token belonging to the test user.
4. A different authenticated test user attempting to access another user's data.

Expected behavior: unauthorized requests are rejected, and authenticated users only receive data they are permitted to access.

## 5. Password Handling

Passwords must be handled securely by the backend.

Security requirements include:

- Never store plaintext passwords.
- Use an established password-hashing library and a suitable password-hashing algorithm.
- Never return password hashes in API responses.
- Validate registration and login input on the server.
- Avoid logging passwords or complete authentication request bodies.
- Use generic login errors where appropriate to reduce unnecessary account information disclosure.

The exact password-hashing algorithm and configuration must be confirmed from the backend implementation.

## 6. JWT Storage and Risks

The current frontend implementation stores the JWT in `localStorage`.

JavaScript running in the page can access this storage. Therefore, a cross-site scripting (XSS) vulnerability could expose the token.

Recommended precautions include:

- Avoid rendering untrusted HTML without sanitization.
- Validate and safely render user-controlled input.
- Keep frontend dependencies updated.
- Avoid logging access tokens.
- Use HTTPS for production communication.
- Review token expiration and invalidation behavior.

An HttpOnly cookie-based authentication design may be evaluated as a separate security improvement. It is not documented as implemented in the current application unless the code actually uses it.

Cookie-based authentication also requires appropriate Secure, SameSite, and CSRF protections.

## 7. Daily Reward Claim Security

The backend must be the authority for determining whether a reward can be claimed.

The client must not be trusted to decide:

- The user's current streak.
- The current reward day.
- Whether a reward is unlocked.
- Whether the user has already claimed.
- The reward amount or currency.
- The user's wallet balance.
- The next eligible claim time.
- Whether a streak should reset.

### Required Validation

Before granting a reward, the backend should:

1. Authenticate the user.
2. Load the relevant streak state.
3. Determine eligibility using server-side data and time.
4. Reject duplicate or ineligible claims.
5. Apply the configured reward.
6. Record the claim and applicable wallet transaction.
7. Return the resulting state to the frontend.

The exact implementation and transaction guarantees must be verified against the backend source code and database behavior.

## 8. Duplicate Claims and Concurrent Requests

A frontend button that becomes disabled after a click is a user-interface safeguard, not a complete security control.

The backend should protect against repeated and simultaneous claim requests.

Potential controls include:

- Server-side eligibility checks.
- Database uniqueness constraints.
- Atomic database operations.
- MongoDB transactions where supported and correctly configured.
- Consistent error handling for duplicate requests.

Do not claim that all race conditions are prevented without verifying the relevant implementation and running concurrent-request tests.

## 9. Wallet and Transaction Integrity

Wallet balances must be managed by trusted backend operations.

Security requirements include:

- Do not trust a balance supplied by the frontend.
- Do not accept arbitrary reward amounts from the client.
- Associate transactions with the authenticated user.
- Validate the source and type of a wallet transaction.
- Keep claim records and wallet changes consistent.
- Prevent a rejected claim from incorrectly crediting a reward.
- Record sufficient transaction information for debugging and auditing.

A complete claim test should check the claim record, wallet balance, and transaction history together.

## 10. API Input Validation

The backend should validate incoming request data.

Validation should cover:

- Required fields.
- Field types.
- Email format.
- Password requirements.
- Valid identifiers.
- Allowed request parameters.
- Reward claim eligibility.
- Unexpected or malformed input.

Invalid requests should return controlled error responses rather than exposing internal database or server errors.

The actual validators and rules should be documented according to the current source code.

## 11. CORS Configuration

The backend must allow requests from the intended frontend origin.

Production frontend:

```text
https://ve-loop-daily-streak.vercel.app
```

Local development frontend:

```text
http://localhost:5173
```

These are example origins based on the project's deployment and local development configuration. The actual allowed origins must be verified against the backend environment and CORS middleware.

CORS is a browser access-control mechanism. It does not replace authentication or authorization.

Do not configure unrestricted origins in production unless there is a deliberate and justified requirement.

## 12. Rate Limiting and Abuse Prevention

Authentication and reward-claim endpoints can be targets for repeated requests.

Recommended protections include:

- Rate limiting for login and registration.
- Appropriate limits for reward-claim requests.
- Request validation.
- Controlled error responses.
- Monitoring of repeated failures.
- Appropriate request and timeout limits.

Only describe rate limiting as active after verifying the relevant middleware and configuration in the backend source code.

## 13. Secrets and Environment Variables

Sensitive configuration must be stored in environment variables or the hosting provider's secret configuration.

Examples include:

- MongoDB connection URI.
- JWT signing secret.
- Other private API credentials, if applicable.

Do not commit real values to GitHub.

A `.env.example` file should contain placeholder values only, for example:

```env
MONGODB_URI=replace_with_your_database_uri
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

These names are examples. Confirm the actual required variable names from the backend configuration before using this template.

The production frontend API URL is configured separately through the appropriate Vercel environment variable.

## 14. HTTPS and Deployment

Production traffic should use HTTPS.

Deployment checks should include:

- Frontend uses the intended backend URL.
- Backend CORS configuration includes the deployed frontend origin.
- Production secrets are configured in the hosting provider.
- Debug output does not disclose sensitive information.
- Logs do not include passwords or authentication tokens.
- Database access is restricted to authorized connections.
- Production endpoints return controlled errors.

A deployed URL responding successfully does not prove that every security control is functioning correctly.

## 15. Error Handling and Logging

Errors shown to users should be understandable and should not reveal internal implementation details.

Avoid exposing:

- Database connection strings.
- JWT signing secrets.
- Passwords or password hashes.
- Full access tokens.
- Sensitive environment configuration.
- Unnecessary internal stack traces.

Server logs should provide enough information to investigate failures without recording sensitive authentication data.

## 16. Security Verification Checklist

### Authentication

- [ ] Missing token is rejected on protected endpoints.
- [ ] Invalid token is rejected.
- [ ] Expired token behavior is verified, if expiration is configured.
- [ ] Logout clears frontend authentication state.
- [ ] Passwords are not stored in plaintext.
- [ ] Authentication secrets are not committed to GitHub.

### Authorization

- [ ] A user can access their own wallet.
- [ ] A user can access their own transaction history.
- [ ] A user cannot access another user's private data.
- [ ] Protected endpoints do not trust client-supplied user identity.

### Reward Integrity

- [ ] Ineligible claims are rejected.
- [ ] Duplicate claims are rejected.
- [ ] Reward values are validated on the backend.
- [ ] Rejected claims do not incorrectly update the wallet.
- [ ] Claim and transaction persistence are verified.
- [ ] Concurrent claim behavior is tested.

### Deployment

- [ ] Production frontend uses HTTPS.
- [ ] Production backend uses HTTPS.
- [ ] CORS allows only intended origins.
- [ ] Production secrets are stored outside the repository.
- [ ] Logs do not expose sensitive data.
- [ ] Production authentication and claim flows are tested.

## 17. Security Limitations

This document is not a penetration-test report or an independent security audit.

Security controls must be confirmed through source-code inspection and appropriate tests. Untested protections must remain marked as unverified.

## 18. Maintenance

Whenever authentication, wallet, reward, database, or deployment behavior changes, update this document and repeat the relevant security checks.