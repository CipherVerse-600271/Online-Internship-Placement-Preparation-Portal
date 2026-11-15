# Sprint 2 Defect and Risk Register

| ID | Type | Description / evidence | Severity | Owner / action | Status |
|---|---|---|---|---|---|
| ENV-001 | Environment / validation blocker | Backend `npm test` ran 7 tests: 3 passed; 4 test files could not load because `mongoose`, `bcryptjs`, and `express` were unavailable. Clean `npm ci` did not complete within the validation window. | Medium | Build Owner: complete clean install, rerun suite; QA Lead reviews result | Open — environment reproduction required |
| ENV-002 | Evidence gap | Frontend dependencies were unavailable; `npm run build` and `npm run lint` were not executed. Hosted GitHub Actions results could not be verified from the ZIP. | Medium | Build Owner: run frontend checks and verify Actions for final PR commit | Open |
| ENV-003 | Acceptance evidence gap | No completed UAT evidence or deployed-environment performance, availability, concurrency, TLS, and accessibility results were supplied. | High | Product Owner coordinates review; named functional and NFR/security test owners execute assigned cases | Open — release blocker until assessed |

## Defect handling policy

1. Reproduce the issue on a clean checkout and record commit SHA, environment, versions, command, and full output.
2. Distinguish source-code defects from missing configuration/dependencies and unavailable external services.
3. Assign severity and priority with the QA Lead.
4. Fix on a dedicated branch and add a regression test where appropriate.
5. Raise a pull request; require review and successful CI before merge.
6. Retest and attach evidence before closing the record.

The entries above are observed blockers/evidence gaps, not claims that a specific feature is defective. Do not close them without the stated evidence.
