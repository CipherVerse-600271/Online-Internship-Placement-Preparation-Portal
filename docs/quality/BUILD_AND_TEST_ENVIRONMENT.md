# Build and Test Environment Runbook

**Owner:** Bhavani Shahapur — Developer / Build Owner  
**Project:** Online Internship & Placement Preparation Portal, Team 12  
**Baseline:** SRS v1.0 and Software Test Plan v1.0

## 1. Purpose and ownership

This runbook records the repeatable local build and test-environment procedure. The Build Owner is responsible for supplying a stable build, keeping environment setup reproducible, triaging defects, and supporting root-cause analysis. It does not replace the QA Lead's test-plan ownership or the Test Engineers' execution responsibilities.

## 2. Prerequisites

- Node.js 22 (CI uses Node.js 22; use the same major version locally).
- npm.
- MongoDB Atlas test cluster or local MongoDB instance.
- Git.
- Optional email sandbox credentials when exercising registration email delivery.

Use anonymised test accounts and data only. Do not use real student resumes, passwords, or personal information in test fixtures.

## 3. Initial setup

From the repository root:

```bash
cd backend
npm ci
cp .env.example .env
```

Set the following values in `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/internship_portal_test
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
JWT_EXPIRES_IN=1h
```

The application database connector reads `MONGODB_URI`. Keep `.env` local; it is ignored by Git. Never commit credentials or production data.

Install and build the frontend:

```bash
cd ../frontend
npm ci
npm run build
npm run lint
```

## 4. Start and verify

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Open the Vite URL printed in the frontend terminal. Verify the backend health endpoint:

```bash
curl -i http://localhost:5000/api/health
```

The current backend starts only after it connects to MongoDB. A database connection failure is an environment failure, not a passing smoke test.

## 5. Repeatable pre-PR checks

Run from the repository root:

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

GitHub Actions runs the backend checks/tests and frontend build/lint on pushes and pull requests to `main`. A PR is not ready for review until required checks finish successfully.

## 6. Test data and reset

Use the anonymised dataset specified in the Software Test Plan: dummy student accounts, recruiter accounts split between approved and pending states, sample internship listings, aptitude questions, and synthetic resume files. The repository currently does not include a complete seed-data script. Until one is added, prepare the dataset in the isolated test database manually and record the dataset version/date in the test execution log.

Never point automated tests at production.

## 7. Failure triage

1. Capture the failing command, complete error output, commit SHA, Node/npm versions, and environment name.
2. Reproduce on a clean checkout and clean dependency install.
3. Identify whether the failure is code, configuration, dependency, database, or external email-service related.
4. Record a defect using `DEFECT_REPORT_TEMPLATE.md`.
5. Assign severity and priority with the QA Lead; do not silently downgrade a security or data-integrity issue.
6. Fix on a dedicated branch, add/adjust a regression test, and open a PR.
7. Re-run all checks and record evidence before closing the defect.

## 8. Known limitations to record

- CI validates syntax, backend authorization helper behavior, project structure, frontend compilation and lint. It does not prove end-to-end flows against a live MongoDB/email provider.
- The 90th-percentile ≤3-second target, 99.5% monthly availability, 5,000 concurrent-user target, TLS configuration, and WCAG 2.1 AA conformance require dedicated deployed-environment evidence. Do not mark them passed based only on CI.
- The Test Plan names Selenium, Jest/Supertest, JMeter, axe DevTools, testssl.sh and OWASP ZAP. Their full test suites/configurations are not present in the supplied source snapshot.
