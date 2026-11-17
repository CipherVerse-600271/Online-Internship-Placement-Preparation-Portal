# Unit Test and Code Coverage Report

**Project:** Online Internship & Placement Preparation Portal  
**Evidence date:** 17 November 2026  
**Scope:** Backend automated unit tests and c8 code coverage.

## 1. Test execution

The backend package uses Node.js's built-in test runner:

```powershell
cd backend
npm test
```

The latest recorded local test execution reported:

| **Metric** | **Result** |
| --- | ---: |
| Tests passed | 71 |
| Tests failed | 0 |
| Test runner | Node.js `node --test` |

## 2. Code coverage

Coverage is generated with c8. The configured command instruments the backend files included by the coverage script and produces text, HTML, LCOV, and JSON summary reports.

| **Coverage metric** | **Recorded result** |
| --- | ---: |
| Statements | 87.66% |
| Branches | 85.10% |
| Functions | 94.87% |
| Lines | 87.66% |

Run the report locally:

```powershell
npm run coverage
Start-Process .\coverage\index.html
```

The HTML report provides file-by-file coverage and highlights uncovered lines. Other generated artifacts include `coverage/lcov.info` and `coverage/coverage-summary.json`.

## 3. Interpretation and limitations

- The backend test suite completed with 71 passing tests and zero failures in the latest recorded local execution.
- Coverage is measurable across statements, branches, functions, and lines.
- The percentages above are aggregate project results; individual files and folders have different coverage levels.
- The root `routes` folder recorded 75.64% statement coverage and 78.89% branch coverage in the reported folder summary, so additional tests in that area could improve coverage.
- The figures represent the coverage run available for this report. Run `npm run coverage` on the submitted checkout to regenerate evidence after any code or test changes.

## 4. Evidence to demonstrate

1. `backend/package.json` — the `test` and `coverage` scripts.
2. Backend test files — test cases executed by Node's test runner.
3. `backend/coverage/index.html` — summary and per-file coverage after running the command.
4. `backend/coverage/lcov.info` — LCOV coverage data.
5. `backend/coverage/coverage-summary.json` — machine-readable coverage summary.
6. GitHub repository — committed test files and this report.

## 5. Conclusion

Backend unit testing and c8 coverage reporting are configured and have been executed. The latest recorded local test run passed all 71 tests with zero failures. Statement, branch, function, and line coverage are reported at 87.66%, 85.10%, 94.87%, and 87.66%, respectively. The generated HTML, LCOV, and JSON summary artifacts provide supporting evidence. Additional tests can be added to improve coverage in lower-covered areas, particularly the root `routes` folder.
