# Sprint 2 Individual Contribution Report — Bhavani Shahapur

**Project:** Online Internship & Placement Preparation Portal
**Team:** 12
**Member:** Bhavani Shahapur
**SRN:** PES2UG24CS114
**Assigned roles in the submitted Software Test Plan:** Developer / Build Owner; Product Owner / Placement Coordinator
**Sprint window in course deliverables:** 26–30 October 2026
**Prepared against:** SRS v1.0 (04-09-2026), SAD supplied in repository, Software Test Plan v1.0 (16-09-2026), and the supplied project ZIP snapshot.

## 1. Scope of my Sprint 2 responsibility

This contribution is limited to the responsibilities assigned to Bhavani in the submitted Software Test Plan:

1. Deliver a stable build and maintain a repeatable build/test environment.
2. Triage defects, support root-cause analysis, and ensure fixes are rechecked.
3. Review acceptance criteria against the SRS and participate in UAT as Product Owner / Placement Coordinator.
4. Review the RTM, test evidence, known deviations, and release-readiness status.
5. Coordinate a responsible development freeze; do not declare a release ready without evidence and required approvals.

The Test Plan separately assigns functional testing to Bhakti S Patil, NFR/security testing to Bharath K, and QA Lead duties to Benita Wilson. This report does not claim those responsibilities or fabricate their test results or approvals.

## 2. Sprint 2 work completed in this contribution package

- Reviewed the existing repository structure, existing CI workflows, backend scripts/tests, environment runbook, UAT record, defect template, test log template, and release checklist.
- Executed the dependency-free backend project-structure check. Result: PASS; 17 required project files were found.
- Executed Node.js syntax validation for every backend JavaScript file outside `node_modules`. Result: PASS; no syntax errors were reported.
- Executed the backend automated test command. Result: BLOCKED/PARTIAL in this environment: 3 tests passed and 4 test files failed to load because required packages (`mongoose`, `bcryptjs`, and `express`) were unavailable. This is an environment/dependency-installation issue until reproduced after a successful clean `npm ci`; it is not recorded as a product pass.
- Attempted a clean backend dependency installation. The install did not complete within the available execution window. The test run therefore cannot be represented as a complete successful run.
- Reviewed the existing repository-wide `.github/workflows/ci.yml` and Sprint 2 workflow. The repository already contains workflows for backend checks/tests and frontend build/lint. A workflow file existing in Git does not prove that a hosted GitHub Actions run passed; hosted run status remains unverified in this package.
- Prepared a Sprint 2 execution report, SRS-to-test-case traceability matrix, Product Owner UAT record, defect register, release/development-freeze record, and two-minute demo narration script.
- Reviewed user-provided local dashboard evidence showing a synthetic recruiter successfully approved by the admin: zero pending recruiter requests, the recruiter shown as Active, and an `admin_recruiter_approved` audit event. The evidence is included under `docs/sprint2/evidence/`.

## 3. Evidence and validation summary

A limited manual check of the admin recruiter-approval workflow was demonstrated on 15 November 2026 using a synthetic local account. The screenshot is included at `docs/sprint2/evidence/admin-recruiter-approval-2026-11-15.png`. This does not establish full recruiter registration/email verification or the remaining end-to-end workflows.

| Check | Evidence / command | Result |
|---|---|---|
| Backend project structure | `cd backend && npm run check` | PASS — 17 required files |
| Backend JavaScript syntax | `find backend ... -name '*.js' ... node --check` | PASS — all discovered backend JS files parsed |
| Backend automated tests | `cd backend && npm test` | BLOCKED/PARTIAL — 3 passed; 4 test files could not load missing dependencies |
| Backend clean dependency install | `cd backend && npm ci` | NOT COMPLETED in this execution window |
| Frontend production build | `cd frontend && npm run build` | NOT RUN — frontend dependencies not installed in this environment |
| Frontend lint | `cd frontend && npm run lint` | NOT RUN — frontend dependencies not installed in this environment |
| Hosted GitHub Actions | Repository workflow run page | NOT VERIFIED from this local ZIP |
| UAT against configured MongoDB/email service | UAT evidence | NOT EXECUTED in this environment |
| Performance, availability, concurrency, TLS and WCAG evidence | Dedicated deployed environment/tools | NOT EXECUTED in this environment |

## 4. Defect / risk disposition

**ENV-001 — Backend dependencies unavailable during validation**
Severity: Medium (validation blocker; not yet confirmed as a source-code defect).
Observed: backend `npm test` could not load test files requiring `mongoose`, `bcryptjs`, and `express`. A clean `npm ci` attempt did not finish within the execution window.
Required disposition: rerun `npm ci` in a network-enabled environment; rerun `npm run check` and `npm test`; if the clean install succeeds and the same failures persist, create a code defect with full logs and commit SHA.

**ENV-002 — Frontend build/lint and hosted CI evidence unavailable**
Severity: Medium (release evidence gap).
Observed: frontend dependencies were not installed and this package cannot inspect the hosted Actions run history.
Required disposition: run frontend `npm ci`, `npm run build`, and `npm run lint`; verify both jobs in GitHub Actions for the final PR commit.

**ENV-003 — UAT/NFR evidence not present in supplied snapshot**
Severity: High for release decision where acceptance criteria require evidence.
Observed: templates exist, but no completed, attributable execution evidence was supplied for UAT, performance, availability, concurrency, TLS, or accessibility.
Required disposition: test owners execute their assigned cases in the configured test/staging environment and attach evidence. Do not mark these requirements passed based on source inspection or CI alone.

## 5. Sprint 2 outcome

The Build Owner deliverables in this package provide reproducible validation records and identify the exact evidence gaps. The Product Owner deliverables provide traceability and an honest UAT/release decision record. Based on the evidence available here, **the product is not approved for release and development freeze is conditional**. The team may freeze feature development only after required fixes, test execution, review, and evidence capture are completed; any remaining release blocker must be recorded and approved by the appropriate roles.

## 6. Ownership boundary

Bhavani Shahapur owns the build/environment and Product Owner review records described above. Benita Wilson remains QA Lead; Bhakti S Patil remains Functional Test Engineer; Bharath K remains NFR/Security Test Engineer, according to the submitted Test Plan. Their execution results and signatures must be supplied by those owners, not inferred or signed on their behalf.

---

**Prepared by:** Bhavani Shahapur (PES2UG24CS114)
**Evidence basis:** supplied project ZIP and submitted SRS/SAD/Software Test Plan.
**Status:** Sprint 2 contribution package prepared; release approval pending verified execution evidence and team sign-offs.
