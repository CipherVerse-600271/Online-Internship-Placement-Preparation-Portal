# Sprint 2 Build and Test Execution Report

**Project:** Online Internship & Placement Preparation Portal — Team 12
**Build Owner:** Bhavani Shahapur (PES2UG24CS114)
**Course Sprint 2 dates:** 26–30 October 2026
**Validation performed for this package:** 15 November 2026
**Runtime:** Node.js v22.16.0; npm 10.9.2; Linux execution environment.

## 1. Purpose

Record the checks that were actually executed against the supplied repository snapshot. This report distinguishes successful checks from blocked or unexecuted checks. It is not a substitute for the full Software Test Plan, live UAT, or hosted CI evidence.

## 2. Executed checks

| ID | Command / activity | Expected | Observed | Status |
|---|---|---|---|---|
| BLD-01 | `cd backend && npm run check` | Required backend project files exist | `Project structure check passed (17 required files).` | PASS |
| BLD-02 | Run `node --check` for each backend `.js` file, excluding `node_modules` | No JavaScript syntax errors | Exit code 0; no syntax output | PASS |
| TST-01 | `cd backend && npm test` | All automated backend tests pass | 3 tests passed; 4 test files failed to load due to missing `mongoose`, `bcryptjs`, and `express` modules | BLOCKED / PARTIAL |
| ENV-01 | `cd backend && npm ci` | Clean dependencies installed from lockfile | Did not complete within execution window | BLOCKED |
| FE-01 | `cd frontend && npm run build` | Production frontend build succeeds | Not run; frontend dependencies unavailable | NOT RUN |
| FE-02 | `cd frontend && npm run lint` | Frontend lint succeeds | Not run; frontend dependencies unavailable | NOT RUN |
| CI-01 | Inspect `.github/workflows/ci.yml` and `.github/workflows/sprint2-ci.yml` | Automated workflow definitions exist | Both workflow files are present; hosted run results not accessible from local snapshot | CONFIG PRESENT / RUN UNVERIFIED |
| UAT-01 | Execute user scenarios against configured test database and email service | UAT scenarios pass with evidence | One local admin recruiter-approval path demonstrated using a synthetic recruiter; email registration and remaining journeys not tested | PARTIAL — see UAT record and evidence screenshot |
| NFR-01 | Execute performance, availability, concurrency, TLS and accessibility tests | Meet SRS measurable targets | No deployed test environment/results supplied | NOT RUN |

## 3. Backend test detail

The `npm test` command reported 7 tests in total:

- 3 passed: authorization helper tests for unauthenticated access, forbidden roles, and permitted roles.
- 4 failed at test-file loading because runtime dependencies were missing: `mongoose`, `bcryptjs`, and `express`.

These failures are classified as dependency/environment blockers pending a successful clean install and rerun. They must not be reported as passing tests or conclusively labelled source-code defects without reproduction after dependency installation.

## 4. Reproduction procedure

From a clean checkout using Node.js 22:

```bash
cd backend
npm ci
npm run check
npm test

cd ../frontend
npm ci
npm run build
npm run lint
```

Capture terminal output, date/time, Node/npm versions, branch, and commit SHA. If a command fails, retain the complete error output and open a defect record. Do not include `.env` files, credentials, personal data, or production database contents in evidence.

## 5. Additional manual evidence supplied on 15 November 2026

The Product Owner demonstrated the local admin recruiter-approval path. A synthetic recruiter account was created directly in the local database with pending status and email-verified set for testing; the admin dashboard then showed the recruiter as Active, zero pending recruiter requests, and an `admin_recruiter_approved` audit event. Screenshot: `evidence/admin-recruiter-approval-2026-11-15.png`. This is limited evidence for the admin approval UI/API path only; it is not evidence for recruiter self-registration, SMTP email verification, rejection, internship creation, or other UAT cases.

## 6. Exit interpretation

The structure and syntax checks pass. Automated backend testing is incomplete, frontend checks are unexecuted, hosted CI results are unverified, and UAT/NFR evidence is absent. Therefore this report does **not** support a release-ready decision. Refer to `SPRINT2_RELEASE_AND_FREEZE_RECORD.md` and `SPRINT2_DEFECT_REGISTER.md`.


## 7. Follow-up CI verification on 16 November 2026

The earlier dependency-blocked local snapshot recorded above was superseded by a successful hosted CI run on main merge commit `b4abfdf4b291061beb9f4caa7647b5b3bdf1ce00`. The backend job completed with **10 tests passed and 0 failed**. c8 reported **34.55% statement coverage, 57.48% branch coverage, 46.15% function coverage, and 34.55% line coverage**; the coverage artifact was uploaded successfully. Frontend build/lint checks also passed. This resolves the earlier dependency-install blocker for that CI build, but the coverage baseline remains modest and does not imply full functional or route coverage. Browser E2E checks for selected student journeys are tracked separately in PR #62.
