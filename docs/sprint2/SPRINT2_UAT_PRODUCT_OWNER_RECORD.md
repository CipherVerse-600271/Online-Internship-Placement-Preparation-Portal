# Sprint 2 UAT and Product Owner Review Record

**Product:** Online Internship & Placement Preparation Portal
**Product Owner / Placement Coordinator:** Bhavani Shahapur (PES2UG24CS114)
**Baseline:** SRS v1.0; Software Test Plan v1.0
**Record status:** Prepared for review; live UAT not executed in the supplied environment.

## 1. Product Owner review approach

The Product Owner checks that acceptance criteria are traceable to the SRS, that UAT outcomes are supported by evidence, that known deviations are documented, and that QA/test owners have supplied their results. Product Owner review does not replace test execution by the named test engineers.

## 2. UAT scenarios for acceptance review

| UAT ID | Scenario | Expected result (from SRS/Test Plan) | Actual result | Status |
|---|---|---|---|---|
| UAT-01 | Student registration and email verification | Verification email is sent; account activation follows confirmation | Not executed | Not run |
| UAT-02 | Recruiter registration | Recruiter remains pending until admin verification | Not tested through the public registration form; a synthetic recruiter was seeded directly for the admin-approval check because email SMTP is not configured | Not run (registration path) |
| UAT-03 | Login/JWT | Valid login returns valid token; invalid login is rejected | Not executed | Not run |
| UAT-04 | Recruiter creates internship | Verified recruiter can create a listing with required fields | Not executed | Not run |
| UAT-05 | Student searches internships | Search and selected filters return matching results | Not executed | Not run |
| UAT-06 | Student submits application | Application and resume reference are recorded | Not executed | Not run |
| UAT-07 | Student tracks application | Latest recruiter status is visible to the student | Not executed | Not run |
| UAT-08 | Student takes timed test | Timer is visible and test auto-submits at zero | Not executed | Not run |
| UAT-09 | Test grading | Score reflects correct answers and is displayed | Not executed | Not run |
| UAT-10 | Admin approves/rejects recruiter | Admin decision controls recruiter privileges | Synthetic `testrecruiter@example.com` was created in local MongoDB with pending status and email-verified flag; admin approved it in the dashboard. Screenshot shows no pending requests, Test Recruiter in the user list as Active, and `admin_recruiter_approved` in recent activity. Rejection path not tested. | PARTIAL PASS — approval path only |

Evidence: [`evidence/admin-recruiter-approval-2026-11-15.png`](evidence/admin-recruiter-approval-2026-11-15.png) — user-provided screenshot of the local admin dashboard after approval (15 November 2026).

## 3. Product Owner review findings

- The supplied repository contains implementation code and test/CI assets; a source snapshot alone does not establish that each end-to-end scenario passes.
- The local admin recruiter-approval path was demonstrated for a synthetic account. This did not test recruiter self-registration, real email verification, or recruiter rejection.
- Build structure and backend syntax checks passed in the recorded validation.
- Backend automated test execution was incomplete because dependencies could not be loaded in the available environment.
- Frontend build/lint, hosted CI run outcomes, live email/database scenarios, and NFR evidence were not supplied.
- Consequently, acceptance cannot be granted on the current evidence set.

## 4. UAT evidence record — fill from actual execution

For each scenario, attach a screenshot, API response, test log, or demo timestamp. Record test account role (use synthetic accounts only), environment, date, build commit SHA, tester, actual result, and defect ID. Never attach real student PII or passwords.

## 5. Product Owner decision

**Current evidence-based recommendation:** Not ready for release / acceptance pending completion of test evidence.
**Build commit SHA reviewed:** Not available from supplied ZIP metadata.
**UAT environment/date:** Local development environment; admin approval screenshot supplied 15 November 2026. Exact browser/build commit not captured.
**Open validation blockers:** ENV-001, ENV-002, ENV-003 in `SPRINT2_DEFECT_REGISTER.md`.
**Product Owner signature/date:** Pending actual review and approval.
**QA Lead signature/date:** Pending QA Lead review.

No signature or approval has been inserted on behalf of a team member.
