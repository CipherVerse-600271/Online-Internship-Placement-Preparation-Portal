# System Validation and Integration Test Report

**Project:** Online Internship & Placement Preparation Portal  
**Evidence date:** 16 November 2026  
**Scope:** Frontend validation, browser-based end-to-end testing, accessibility automation, and planned deployment-level validation.

## 1. Purpose

This report records the available system-level validation evidence. It distinguishes automated checks that passed from checks that are only documented or prepared and still require execution against a deployed environment.

## 2. Automated system validation

| Validation activity | Recorded status | Evidence / meaning |
|---|---|---|
| Browser end-to-end tests using Playwright | Passed in recorded CI | Selected browser workflows were exercised automatically. |
| Public portal and search loading | Included in E2E suite | Covers selected public-facing portal behavior. |
| Student registration and sign-in | Passed in recorded E2E run | Covers a selected student account journey. |
| Accessibility scan using axe | Passed in recorded PR #63 checks | Landing-page scan checked for serious/critical WCAG 2.1 A/AA violations. |
| Frontend production build | Passed in CI | Confirms the frontend production build completes. |
| Frontend lint | Passed in CI | Runs the configured static checks; warnings, if any, should be reviewed separately. |

The E2E suite covers selected workflows only. It is not evidence that every student, recruiter, administrator, internship, application, aptitude-test, and notification scenario has been exhaustively tested.

## 3. Accessibility validation

An automated axe scan is included for the public landing page and passed in the recorded PR #63 checks. A manual checklist is also available at:

`docs/quality/ACCESSIBILITY_CHECKLIST.md`

Manual keyboard-only navigation, screen-reader use, zoom, responsive layout, and full WCAG 2.1 AA review must be completed and recorded separately before claiming full accessibility conformance.

## 4. Performance and load testing

A configurable k6 test harness is available at:

`tests/load/portal-load.js`

It supports configuration through `BASE_URL`, `TARGET_PATH`, `VUS`, and `DURATION`. The script defines response-time and error-rate thresholds.

**Important:** The presence of the script is not proof that a load test has passed. No executed 5,000-concurrent-user result is claimed in this report. Run high-volume tests only against an approved staging deployment with authorization, monitoring, and an agreed test window.

## 5. Deployment-level checks still required

| Validation area | Current evidence | Remaining validation |
|---|---|---|
| 5,000 concurrent users | Target documented; no result claimed | Execute controlled test against approved staging and retain k6 output. |
| Performance target | Threshold configured in test harness | Record measured p90 latency and error rate from the target environment. |
| 99.5% monthly availability | Requirement documented | Gather uptime monitoring evidence over the measurement period. |
| Manual accessibility | Checklist documented; automated landing-page scan passed | Complete keyboard, screen-reader, contrast, zoom, and responsive checks. |
| HTTPS / TLS 1.2+ | Requirement tracked in project backlog | Verify the deployed endpoint and TLS configuration. |

## 6. Evidence to demonstrate

1. `frontend/e2e/` — Playwright browser test specifications.
2. `.github/workflows/e2e.yml` — CI workflow that runs browser tests.
3. GitHub Actions — successful Browser end-to-end tests and frontend build checks.
4. `docs/quality/ACCESSIBILITY_CHECKLIST.md` — manual accessibility checklist.
5. `tests/load/portal-load.js` — k6 load-test harness.
6. `docs/quality/QUALITY_VALIDATION_STATUS.md` — consolidated validation status and outstanding evidence.

## 7. Conclusion

Selected browser-based system workflows, frontend build/lint checks, and an automated landing-page accessibility scan have passed in the recorded CI evidence. Full system coverage, 5,000-user load performance, monthly availability, manual accessibility conformance, and deployed HTTPS/TLS validation remain separate activities and must not be reported as passed until evidence is collected.
