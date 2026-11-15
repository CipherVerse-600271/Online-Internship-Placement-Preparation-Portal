# Sprint 2 Requirements Traceability Matrix Status

**Baseline:** SRS v1.0 and Software Test Plan v1.0.
**Status rule:** A test-case mapping is not proof of execution. All rows below are `Not evidenced in supplied execution`; update only after the named test owner executes the case and attaches evidence.

## Functional requirements

| SRS requirement | Test Plan test case | Test ownership per Test Plan | Execution status in supplied evidence |
|---|---|---|---|
| IPP-F-001 Student registration/email verification | TC-Auth-01 | Functional test engineer | Not evidenced |
| IPP-F-002 Recruiter registration pending verification | TC-Auth-02 | Functional test engineer | Not evidenced |
| IPP-F-003 JWT login | TC-Auth-03 | Functional test engineer | Not evidenced |
| IPP-F-004 OTP password reset | TC-Auth-04 | Functional test engineer | Not evidenced |
| IPP-F-005 Account lockout | TC-Auth-05 | Functional test engineer | Not evidenced |
| IPP-F-006 Recruiter creates internship | TC-List-01 | Functional test engineer | Not evidenced |
| IPP-F-007 Internship search/filter | TC-List-02 | Functional test engineer | Not evidenced |
| IPP-F-008 Internship details/eligibility/deadline | TC-List-03 | Functional test engineer | Not evidenced |
| IPP-F-009 Matching internship notification | TC-List-04 | Functional test engineer | Not evidenced |
| IPP-F-010 Student application with resume/cover letter | TC-App-01 | Functional test engineer | Not evidenced |
| IPP-F-011 Application status tracking | TC-App-02 | Functional test engineer | Not evidenced |
| IPP-F-012 Recruiter reviews and updates applications | TC-App-03 | Functional test engineer | Not evidenced |
| IPP-F-013 Status-change notification | TC-App-04 | Functional test engineer | Not evidenced |
| IPP-F-014 Timed aptitude test/auto-submit | TC-Test-01 | Functional test engineer | Not evidenced |
| IPP-F-015 Auto-grading/immediate score | TC-Test-02 | Functional test engineer | Not evidenced |
| IPP-F-016 Test attempt history | TC-Test-03 | Functional test engineer | Not evidenced |
| IPP-F-017 Student dashboard/skill gap | TC-Ana-01 | Functional test engineer | Not evidenced |
| IPP-F-018 Admin placement analytics | TC-Ana-02 | Functional test engineer | Not evidenced |
| IPP-F-019 Internship recommendations | TC-Ana-03 | Functional test engineer | Not evidenced |
| IPP-F-020 Admin recruiter approval/rejection | TC-Admin-01 | Functional test engineer | Not evidenced |
| IPP-F-021 Admin listing/account management | TC-Admin-02 | Functional test engineer | Not evidenced |

## Non-functional and security requirements

| SRS requirement | Test Plan test case | Test ownership per Test Plan | Execution status in supplied evidence |
|---|---|---|---|
| IPP-NF-001 90th percentile response time ≤3 seconds under normal load | TC-Perf-01 | NFR/security test engineer | Not evidenced |
| IPP-NF-002 99.5% monthly availability | TC-Ops-01 | NFR/security test engineer | Not evidenced |
| IPP-NF-003 Salted bcrypt password hashing | TC-Sec-01 | NFR/security test engineer | Not evidenced |
| IPP-NF-004 5,000 concurrent users | TC-Perf-02 | NFR/security test engineer | Not evidenced |
| IPP-NF-005 Responsive UI/WCAG 2.1 AA basics | TC-UX-01 | NFR/security test engineer | Not evidenced |
| IPP-SR-001 TLS 1.2+ | TC-Sec-02 | NFR/security test engineer | Not evidenced |
| IPP-SR-002 bcrypt salted password hashing | TC-Sec-01 | NFR/security test engineer | Not evidenced |
| IPP-SR-003 RBAC on every API endpoint | TC-Sec-03 | NFR/security test engineer | Not evidenced |
| IPP-SR-004 Secure time-bound test tokens | TC-Sec-04 | NFR/security test engineer | Not evidenced |
| IPP-SR-005 Authentication/admin audit logs retained for one year | TC-Sec-05 | NFR/security test engineer | Not evidenced |

## Build-owner checks

| Check | Evidence | Status |
|---|---|---|
| Project structure | `npm run check`: 17 required files found | Pass |
| Backend JavaScript syntax | `node --check` over backend JS files | Pass |
| Backend automated suite | 3 passed; 4 test files blocked by missing packages | Blocked/partial |
| Frontend build and lint | Dependencies unavailable; not run | Not run |
| Hosted GitHub Actions | Workflow definitions exist; run outcome not verified | Unverified |

**Action:** QA Lead Benita Wilson, Functional Test Engineer Bhakti S Patil, and NFR/Security Test Engineer Bharath K must update their respective test execution evidence. Bhavani Shahapur reviews the consolidated RTM as Product Owner; this matrix does not fabricate their results.
