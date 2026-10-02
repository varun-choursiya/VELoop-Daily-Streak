
# VELoop Rewards — Testing and QA Report

## 1. Purpose

This document records the testing performed for the VELoop Rewards Daily Streak application.

It separates recorded development test results from scenarios that still require verification. A test must not be marked as passed unless its result was actually observed.

## 2. Application Under Test

| Component | URL |
|---|---|
| Frontend | https://ve-loop-daily-streak.vercel.app |
| Backend | https://veloop-daily-streak-g4be.onrender.com |
| Local backend used for recorded API checks | `http://localhost:5000` |

**Important:** The recorded API test results below were obtained against the local backend. They must not be treated as proof that the corresponding production endpoints pass.

## 3. Test Environment

The development environment includes:

- React frontend.
- Node.js and Express.js backend.
- MongoDB.
- JWT-based authentication.
- Axios-based frontend API requests.
- Vite frontend build tooling.

Exact package versions and runtime configuration are available in the project's package and environment configuration files.

## 4. Recorded Test Results

The following results were recorded in the development QA report.

| ID | Test | Recorded result | Status |
|---|---|---|---|
| T01 | Health endpoint | HTTP 200 | PASS — recorded |
| T02 | Protected endpoint without token | HTTP 401 | PASS — recorded |
| T03 | Protected endpoint with invalid JWT | HTTP 401 | PASS — recorded |
| T04 | Malformed registration request | HTTP 400 | PASS — recorded |
| T05 | Duplicate email registration | HTTP 409 | PASS — recorded |
| T06 | Invalid login credentials | HTTP 401 | PASS — recorded |
| T07 | Demo user login | HTTP 200 | PASS — recorded |
| T08 | Streak status request | HTTP 200 | PASS — recorded |
| T09 | Invalid/tampered request | HTTP 400 | PASS — recorded |
| T10 | Attempt to claim a locked reward | HTTP 409 | PASS — recorded |
| T11 | Wallet request | HTTP 200 | PASS — recorded |
| T12 | Wallet transaction history request | HTTP 200 | PASS — recorded |
| T13 | Streak claim history request | HTTP 200 | PASS — recorded |
| T14 | Frontend production build | Build passed | PASS — recorded |
| T15 | Deployed Vercel frontend response | HTTP 200 | PASS — recorded |

These entries reflect previously recorded development results, not a new test execution performed during this review. Retain them only if they match your actual test evidence.

## 5. Test Coverage

### Authentication

Recorded checks cover missing authentication, an invalid JWT, malformed registration input, duplicate registration, invalid login credentials, and successful demo-user login.

Additional checks should verify token expiration, logout behavior, and access to another user's data where applicable.

### Daily Streak

A successful streak-status request and a rejected locked-reward claim were recorded.

The following behaviors still require explicit verification unless separate test evidence is available:

- A valid eligible claim.
- A repeated claim after a successful claim.
- Simultaneous claim requests.
- Streak reset after a missed eligible period.
- Completion of the full seven-day reward cycle.
- Wallet and history consistency after a successful claim.

### Wallet

Wallet balance and transaction-history endpoints returned successful responses in the recorded local checks.

A complete claim-flow test should also verify that a successful claim produces the expected persistent balance and transaction record, and that a rejected claim does not incorrectly credit a reward.

### Frontend

The production frontend returned HTTP 200 in the recorded check, and the frontend build passed.

An HTTP 200 response does not by itself confirm that login, API requests, account menus, wallet values, streak timers, or reward interactions all work correctly in the browser.

## 6. Tests Not Yet Verified

The following items were not confirmed by the recorded QA results:

| Scenario | Status |
|---|---|
| Successful eligible reward claim | Not tested in the recorded report |
| Duplicate claim after a successful claim | Not tested in the recorded report |
| Concurrent requests attempting the same claim | Not load-tested |
| Missed-day reset behavior | Not tested in the recorded report |
| Complete seven-day reward cycle | Not tested in the recorded report |
| Complete production API flow | Not independently verified here |
| Production database persistence across a full claim flow | Not independently verified here |

A source-code inspection alone should not be reported as a successful runtime test.

## 7. Manual Verification Checklist

Use this checklist during final testing.

### Authentication

- [ ] Register a new test account.
- [ ] Log in with valid credentials.
- [ ] Confirm invalid credentials are rejected.
- [ ] Confirm protected API requests fail without valid authentication.
- [ ] Confirm logout clears the frontend's authentication state.
- [ ] Confirm a logged-out user cannot access protected account data.

### Daily Streak

- [ ] Open the Daily Streak page while authenticated.
- [ ] Confirm streak information loads from the API.
- [ ] Confirm the displayed day and claim state match the server response.
- [ ] Claim a reward when the server says it is eligible.
- [ ] Refresh the page and verify the updated state persists.
- [ ] Attempt to claim again and confirm the backend rejects the request.
- [ ] Attempt to claim a locked reward and confirm it is rejected.
- [ ] Verify reset behavior using a controlled test setup.
- [ ] Verify the complete seven-day cycle using a controlled test setup.

### Wallet

- [ ] Confirm the wallet balance loads from the backend.
- [ ] Confirm a successful reward claim updates the applicable balance.
- [ ] Confirm the transaction appears in transaction history.
- [ ] Confirm rejected claims do not incorrectly credit rewards.
- [ ] Refresh the page and verify persisted data remains consistent.

### Responsive UI

- [ ] Test a narrow mobile viewport.
- [ ] Test a tablet viewport.
- [ ] Test a desktop viewport.
- [ ] Confirm there is no unintended horizontal overflow.
- [ ] Confirm the wallet and streak indicators remain visible.
- [ ] Confirm the account popup appears above page content.
- [ ] Confirm the logout action works.
- [ ] Confirm loading, success, and error states are understandable.

### Deployment

- [ ] Confirm the Vercel frontend opens.
- [ ] Confirm the frontend uses the intended Render API URL.
- [ ] Confirm CORS allows the deployed frontend origin.
- [ ] Test production login and logout.
- [ ] Test production streak status.
- [ ] Test production wallet and transaction history.
- [ ] Test a successful claim using a designated test account, if safe to do so.
- [ ] Review Render logs for unexpected errors.
- [ ] Confirm secrets are not committed to the repository.

## 8. Production Verification Record

Complete this section after running the tests against the deployed environment.

| Check | Result | Evidence / date |
|---|---|---|
| Frontend opens | Not independently verified here | Add observed result |
| Production login | Not independently verified here | Add observed result |
| Production streak status | Not independently verified here | Add observed result |
| Production wallet | Not independently verified here | Add observed result |
| Production transaction history | Not independently verified here | Add observed result |
| Production eligible claim | Not independently verified here | Add observed result |
| Duplicate claim rejection | Not independently verified here | Add observed result |
| Production persistence | Not independently verified here | Add observed result |

Do not change a status to PASS until the relevant test has been executed and its result observed.

## 9. Test Data and Credentials

Use dedicated test accounts and non-sensitive sample data.

If a demo account is included in the project, identify it as a test account and confirm that its credentials are intended for sharing before publishing them in documentation.

Never include production passwords, live JWTs, database credentials, or other secrets in this report.

## 10. Known Testing Limitations

- The recorded API tests were performed against the local backend.
- The frontend build passing does not prove every browser interaction works.
- An HTTP 200 response from a deployed frontend does not prove every API integration works.
- Duplicate-claim and concurrency behavior require explicit runtime tests.
- Full-cycle streak reset and reward behavior require controlled test scenarios.
- Production verification must be recorded separately from local verification.

## 11. QA Summary

The recorded development report documents successful responses for several authentication, streak, and wallet API checks, as well as a passing frontend build and a successful frontend HTTP response.

The report does not establish that every business rule, concurrent claim scenario, complete seven-day cycle, or production API flow has been verified.

The project should be considered ready for final QA only after the remaining critical scenarios have been tested and the results documented accurately.