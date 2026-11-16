# Test and Code Coverage

## Current coverage scope

The automated coverage command currently measures the **backend JavaScript files** exercised by the existing Node.js test suite. It uses [c8](https://github.com/bcoe/c8), which collects V8 coverage and reports:

- **Statement coverage:** percentage of executable statements run by tests.
- **Branch coverage:** percentage of conditional branches (for example, both outcomes of an `if`) run by tests.
- **Function coverage:** percentage of functions invoked by tests.
- **Line coverage:** percentage of executable lines run by tests.

Coverage is a measure of which code ran during tests. It does not prove that the code is correct or that every possible input was tested.

## Run locally

From the `backend` directory:

```bash
npm ci
npm run coverage
```

The command runs the existing `node:test` suite under c8 and creates:

- `coverage/index.html` — browsable HTML report, including file-level details.
- `coverage/lcov.info` — LCOV data for compatible reporting tools.
- `coverage/coverage-summary.json` — machine-readable summary.
- A text summary in the terminal.

Open `backend/coverage/index.html` in a browser to inspect the report.

The first run may download the pinned c8 CLI version through npx. Internet access is required unless the package is already cached.

## GitHub Actions

The `Portal CI` workflow runs the backend coverage command after the backend project checks. It uploads the generated `backend/coverage/` directory as the workflow artifact named **backend-coverage-report**. Open the successful or completed workflow run in GitHub, then download the artifact from its Artifacts section. Artifacts are retained for 14 days.

## Interpreting the numbers

A higher percentage means more of the measured code was executed by the current tests. Pay particular attention to branch coverage for validation, authorization, error handling, and other decision-heavy code. Review uncovered lines and add meaningful tests for important missing paths.

No minimum percentage threshold is enforced yet. Establish a baseline from actual CI results before setting a threshold; do not report an assumed or target percentage as measured coverage.

## Current limitations

- Coverage currently measures backend JavaScript only.
- The frontend currently has build and lint checks but no configured automated test runner or frontend coverage report.
- Python scripts, database behavior outside the tests, browser interactions, and deployed-system non-functional properties are not included in this coverage measurement.
- A passing coverage command does not replace manual, integration, security, performance, accessibility, or end-to-end testing.

Frontend coverage can be added after frontend component and interaction tests are introduced.
