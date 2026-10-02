
# VELoop Rewards — System Architecture

## 1. Overview

VELoop Rewards Daily Streak is a full-stack web application built around a React frontend, an Express.js API, and MongoDB.

The frontend displays streak progress, reward cards, wallet balances, and claim history. The backend processes authenticated requests and provides the data used by the interface.

The fundamental architectural principle is:

**The frontend controls presentation. The backend controls authoritative application state.**

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Frontend build tool | Vite |
| Routing | React Router, where configured |
| HTTP client | Axios |
| Backend runtime | Node.js |
| API framework | Express.js |
| Database | MongoDB |
| Database integration | Mongoose, where used |
| Authentication | JSON Web Tokens (JWT) |
| Frontend hosting | Vercel |
| Backend hosting | Render |

The exact dependencies and versions are defined in the respective `package.json` files.

## 3. High-Level Architecture

```text
                    USER
                     |
                     v
             React Frontend
               (Vercel)
                     |
                     | HTTP / REST API
                     | Authorization: Bearer <JWT>
                     v
             Express.js Backend
                (Render)
                     |
            +--------+--------+
            |        |        |
            v        v        v
        Auth API  Streak API Wallet API
            |        |        |
            +--------+--------+
                     |
                     v
               MongoDB
                     |
          +----------+----------+
          |          |          |
          v          v          v
       User Data  Streak Data  Wallet /
                              Transactions
```

This diagram describes the application's logical structure. Actual model names, database collections, and route organization should be confirmed from the current source code.

## 4. Deployment Architecture

### Frontend

Production URL:

https://ve-loop-daily-streak.vercel.app

The frontend is deployed on Vercel. It sends API requests to the configured backend URL.

### Backend

Production URL:

https://veloop-daily-streak-g4be.onrender.com

The backend is deployed on Render and exposes the API routes used by the frontend.

### Environment Configuration

The frontend API base URL is configured through `VITE_API_URL`, where provided by the application.

Example production value:

```env
VITE_API_URL=https://veloop-daily-streak-g4be.onrender.com/api
```

Example local value:

```env
VITE_API_URL=http://localhost:5000/api
```

The API client and route definitions must follow one consistent URL convention to avoid duplicate `/api/api` paths.

Backend environment variables must be taken from the backend configuration and example environment files. Secrets must remain outside the repository.

## 5. Frontend Request Flow

The general request flow is:

```text
User opens the application
          |
          v
React renders the interface
          |
          v
Frontend API service sends a request
          |
          v
Axios attaches the JWT when available
          |
          v
Express receives the request
          |
          v
Authentication middleware validates
protected requests
          |
          v
Route / controller processes request
          |
          v
Backend reads or updates MongoDB
          |
          v
API returns a response
          |
          v
React updates the displayed interface
```

The frontend should render loading, success, empty, and error states according to the API response.

## 6. Authentication and Authorization

The current frontend implementation stores the JWT in `localStorage` under the key:

```text
veloop_token
```

The Axios request interceptor reads the token and adds the following header when a token is available:

```http
Authorization: Bearer <JWT_TOKEN>
```

The backend must validate the token before returning protected user information or performing protected operations.

### Authentication Flow

```text
User submits login form
          |
          v
Frontend sends login request
          |
          v
Backend validates credentials
          |
          v
Backend returns user data and JWT
          |
          v
Frontend stores the token
          |
          v
Subsequent requests include the token
          |
          v
Backend authenticates protected requests
```

The precise token expiration, signing algorithm, refresh behavior, and invalid-token handling must be confirmed from the implementation.

### Security Note

`localStorage` is accessible to JavaScript running on the page. An HttpOnly cookie-based authentication design may reduce exposure to token theft through certain XSS scenarios, but it introduces its own requirements, including cookie configuration and CSRF considerations.

HttpOnly cookie authentication must not be documented as implemented unless it is present in the code.

## 7. Daily Streak Data Flow

The daily streak page requests its current state from the backend.

Relevant frontend API operations include:

```javascript
getStreak = api.get("/daily-streak");
getStreakStatus = api.get("/daily-streak/status");
claimStreak = api.post("/daily-streak/claim", {});
getHistory = api.get("/daily-streak/history");
getWallet = api.get("/wallet");
```

These are representative API calls from the frontend integration. Confirm their current definitions in the repository if routes are changed.

### Loading the Streak Page

```text
User opens Daily Streak page
          |
          v
Frontend requests streak data
          |
          v
Backend retrieves applicable user data
          |
          v
Backend returns streak and reward information
          |
          v
Frontend renders the current state
```

The frontend should use the returned data instead of inventing the user's authoritative streak status.

## 8. Reward Claim Flow

```text
User clicks Claim Reward
          |
          v
Frontend submits claim request
          |
          v
Backend authenticates the request
          |
          v
Backend validates current eligibility
          |
          v
Backend processes the claim
          |
          v
Applicable wallet and claim records update
          |
          v
Backend returns the result
          |
          v
Frontend refreshes relevant data
          |
          v
Updated streak and wallet are displayed
```

The backend must decide whether the claim is permitted. Disabling the claim button in the frontend improves user experience but is not a substitute for server-side validation.

If the application displays a reward-processing animation, that animation should not be described as a real third-party CPA or advertising integration unless such an integration exists.

## 9. Wallet and Transaction Flow

The frontend retrieves wallet information through:

```http
GET /api/wallet
```

Transaction history is retrieved through:

```http
GET /api/wallet/transactions
```

The backend should associate wallet and transaction data with the authenticated user.

A reward claim should not be considered successful merely because the frontend displays a success message. The server response and persisted data must support that outcome.

## 10. Database Layer

MongoDB stores application data. Mongoose is used where configured by the backend.

The application includes data associated with users, streak progress, reward claims, wallet balances, and transactions.

The exact schema, collection names, indexes, and relationships must be taken from the current model files and database configuration.

Do not assume that an index, database transaction, or uniqueness constraint exists unless it is present in the implementation.

## 11. Duplicate Claims and Concurrency

The backend must reject an ineligible or duplicate reward claim according to the implemented business rules.

Potential protections include:

- Server-side eligibility validation.
- Database uniqueness constraints for applicable claim identifiers.
- Atomic database updates or transactions.
- Consistent handling of simultaneous claim requests.

These protections are implementation-dependent. A successful single-user test does not prove that simultaneous requests are handled safely.

Concurrency protection should only be described as verified after inspecting the actual implementation and running appropriate concurrent-request tests against the relevant environment.

## 12. Error Handling

The frontend should handle API errors without exposing internal server details to the user.

Examples include:

| Situation | Expected frontend behavior |
|---|---|
| Missing or invalid authentication | Request login or re-authentication |
| Invalid request | Display an understandable validation message |
| Reward already claimed | Explain that the claim is unavailable |
| Reward still locked | Explain that the next reward is not yet eligible |
| Network error | Display a retry option or connection message |
| Server error | Display a generic failure message |

Exact messages and HTTP status codes should follow the backend's actual responses.

## 13. Responsive User Interface

The frontend is intended to support mobile, tablet, and desktop screens.

Responsive behavior includes the navigation header, wallet display, streak indicator, reward cards, content sections, and account menu.

The UI should be checked at representative narrow, medium, and wide viewport sizes. Visual testing should confirm that content remains readable and that menus are not obscured by page content.

## 14. Known Scope and Limitations

- The application uses JWT storage in `localStorage` in its current frontend implementation.
- A demo reward-processing animation is not equivalent to a real CPA network integration.
- Automated or manual test coverage must be described according to tests actually performed.
- Local API test results do not establish production API availability.
- Concurrency safety must be supported by implementation review and relevant tests.
- Production secrets must be stored in the hosting provider's environment configuration.

## 15. Architecture Maintenance

When changing the application:

1. Keep API paths consistent between frontend and backend.
2. Keep user-specific operations protected by authentication.
3. Keep authoritative reward decisions in the backend.
4. Update this document when the real architecture changes.
5. Verify claims against source code and actual tests.
6. Do not document planned functionality as already implemented.