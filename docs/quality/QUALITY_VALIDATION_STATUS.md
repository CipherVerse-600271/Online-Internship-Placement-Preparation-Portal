# Quality Validation Status

**Project:** Online Internship & Placement Preparation Portal  
**Branch baseline:** `main` after PR #62 merge  
**Validation record:** 16 November 2026

## Implemented automated checks

| Area | Evidence in repository | Status |
|---|---|---|
| Backend unit tests | `backend/test/*.test.js`, Node test runner | Implemented; CI execution must pass |
| Statement, branch, function and line coverage | `backend/package.json` coverage script using c8 | Implemented; reports uploaded by CI |
| Backend syntax and project structure | `Portal CI` workflow | Implemented |
| Frontend build and lint | `Portal CI` workflow | Implemented |
| Browser system / E2E tests | `frontend/e2e/portal.spec.js`, Playwright workflow | Implemented for public portal/search shell and student registration/sign-in |
| Authorization and HTTP/HTTPS middleware tests | `backend/test/authorization.test.js`, `backend/test/httpsOnly.test.js` | Implemented at middleware/helper level |
| Automated accessibility scan | Playwright + axe on public landing page | Partial; automated scan only |
| Load-test harness | `tests/load/portal-load.js` (k6) | Added; not executed against staging |

## Validation that still requires execution and evidence

| Requirement | Acceptance target | Current status | Evidence needed to close |
|---|---|---|---|
| API response performance (IPP-NF-001) | p90 under 3 seconds under agreed normal load | Not verified | Dated k6 report against staging, target path mix, request count, p90/p95 and error rate |
| Concurrent-user scalability (IPP-NF-004) | Test 5,000 concurrent users | Not run | Approved staging capacity, 5,000-VU run, server resource metrics and results |
| Availability (IPP-NF-002) | 99.5% monthly availability | Not verified | Monitoring data across a full measurement window and incident/downtime record |
| Accessibility (IPP-NF-005) | WCAG 2.1 AA basics | Partial | Complete `ACCESSIBILITY_CHECKLIST.md` manually and resolve findings |
| Production TLS (IPP-SR-001) | HTTPS and TLS 1.2+ enforced | Not verified | Scan deployed host with testssl.sh or equivalent and capture certificate/protocol report |
| Full security validation | Authentication, authorization, input validation, rate limiting, dependency and deployment checks | Partial | Execute security test plan / OWASP ZAP against an approved staging environment and record findings |

## Safe load-test execution

Run only against an isolated staging deployment with the team's approval. Do not point stress tests at production or a shared class demo service.

Install k6, then run a low-load smoke profile:

```bash
BASE_URL=https://staging.example.invalid VUS=10 DURATION=1m k6 run tests/load/portal-load.js
```

Only after confirming staging capacity and receiving approval, run the 5,000-user acceptance profile:

```bash
BASE_URL=https://staging.example.invalid VUS=5000 DURATION=5m k6 run tests/load/portal-load.js
```

Replace the example host with the approved staging URL. Save the complete k6 output and monitoring screenshots. The script defaults to `/api/health`; choose representative application endpoints using `TARGET_PATH` and execute separate scenarios for authenticated routes with safe test credentials before making a system-wide performance claim.

## Important interpretation

Passing CI proves that the configured automated checks passed for the tested commit. It does not prove 5,000-user capacity, 99.5% monthly uptime, production TLS configuration, or full WCAG conformance. Keep GitHub issues #10 and #20 open until their deployment-level acceptance evidence is reviewed.
