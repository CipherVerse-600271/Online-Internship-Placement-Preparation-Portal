# Acceptance Criteria and UAT Record

**Product Owner / Placement Coordinator:** Bhavani Shahapur  
**Source baseline:** SRS v1.0, Section 6; Software Test Plan v1.0, Sections 9 and 13.

## Acceptance baseline

The SRS states that release acceptance requires:
- All High-priority functional requirements implemented and verified.
- No critical non-functional requirement failures.
- The Requirements Traceability Matrix (RTM) showing all listed test cases passed.

The Product Owner reviews the acceptance criteria against the SRS, participates in UAT, records outcomes, and signs release readiness only after evidence is reviewed. A blank or unexecuted test is not a pass.

## UAT execution record

Complete one row per scenario. Attach screenshots, API responses, test logs, or a recording link as evidence.

| UAT ID | Requirement / scenario | Expected result | Actual result | Evidence link | Status (Not run / Pass / Fail / Blocked) | Defect ID | Tester / date |
|---|---|---|---|---|---|---|---|
| UAT-01 | Student registration and email verification (IPP-F-001) | Verification email is sent; login is rejected before verification and succeeds after verification. | | | Not run | | |
| UAT-02 | Recruiter registration pending verification (IPP-F-002) | Unverified recruiter cannot post listings; admin decision controls access. | | | Not run | | |
| UAT-03 | Secure login and JWT (IPP-F-003) | Valid credentials return a signed, expiring token; invalid credentials do not. | | | Not run | | |
| UAT-04 | Internship creation by verified recruiter (IPP-F-006) | Listing is saved and searchable with required fields. | | | Not run | | |
| UAT-05 | Internship search and filters (IPP-F-007) | Results satisfy all selected filters; no-match state is clear. | | | Not run | | |
| UAT-06 | Application submission (IPP-F-010) | Application record is created with status Applied and resume reference. | | | Not run | | |
| UAT-07 | Application status tracking (IPP-F-011) | Student sees the latest recruiter status. | | | Not run | | |
| UAT-08 | Timed aptitude test (IPP-F-014) | Test auto-submits at zero and records the attempt. | | | Not run | | |
| UAT-09 | Automatic grading (IPP-F-015) | Displayed score equals the correct-answer count. | | | Not run | | |
| UAT-10 | Admin recruiter approval/rejection (IPP-F-020) | Approved recruiter can proceed; rejected recruiter cannot log in or post. | | | Not run | | |

## UAT exit review

- [ ] High-priority functional acceptance scenarios have evidence and pass.
- [ ] No open Critical defects.
- [ ] Open High defects have documented disposition and approval.
- [ ] NFR evidence has been reviewed; any deviation is documented.
- [ ] RTM statuses are updated by the responsible test owners.
- [ ] Known limitations and deviations from SRS/SAD/Test Plan are documented.
- [ ] Sprint/release demonstration is based on the exact reviewed build/commit.

## Product Owner release recommendation

Build / commit SHA:  
Environment:  
UAT execution dates:  
Outstanding defects and accepted deviations:  
Decision: **Not reviewed / Ready for release / Not ready for release**  
Product Owner (Bhavani Shahapur):  
Date:  
QA Lead sign-off (Benita Wilson):  
Date:

*Do not fill in a release approval until the test evidence and exit criteria have actually been reviewed.*
