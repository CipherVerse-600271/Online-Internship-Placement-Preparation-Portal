# Unit Test and Code Coverage Report

**Project:** Online Internship & Placement Preparation Portal  
**Evidence date:** 16 November 2026  
**Scope:** Backend automated unit tests and c8 code coverage.

## 1. Test execution

The backend package uses Node.js's built-in test runner:

```powershell
cd backend
npm test
```

The latest recorded CI execution on 16 November 2026 reported:

| Metric | Result |
|---|---:|
| Tests passed | 10 |
| Tests failed | 0 |
| Test runner | Node.js `node --test` |

## 2. Code coverage

Coverage is generated with c8 10.1.3. The configured command includes backend source files under `src`, `routes`, `models`, `middleware`, `utils`, and `config`, and produces text, HTML, LCOV, and JSON summary reports.

| Coverage metric | Recorded result |
|---|---:|
| Statements | 34.55% |
| Branches | 57.48% |
| Functions | 46.15% |
| Lines | 34.55% |

Run the report locally:

```powershell
npm run coverage
Start-Process .\coverage\index.html
```

The HTML report provides file-by-file coverage and highlights uncovered lines. Other generated artifacts include `coverage/lcov.info` and `coverage/coverage-summary.json`.

## 3. Interpretation and limitations

- Unit tests and coverage instrumentation are implemented and were executed in CI.
- The recorded result is 10 passing tests and zero failures.
- Coverage is measurable but incomplete. The percentages above are not 100%; additional tests are needed, especially for statements, functions, and lines.
- Some backend routes and models have low or no recorded coverage.
- The figures are the latest recorded CI baseline available for this report. Run `npm run coverage` on the current checkout to produce fresh local evidence.

## 4. Evidence to demonstrate

1. `backend/package.json` — the `test` and `coverage` scripts.
2. Backend test files — test cases executed by Node's test runner.
3. `backend/coverage/index.html` — summary and per-file coverage after running the command.
4. GitHub Actions — successful backend test and coverage workflow, including the uploaded coverage artifact.

## 5. Conclusion

Backend unit testing and c8 coverage reporting are configured. The latest recorded CI run passed all 10 tests. Statement, branch, function, and line coverage are reported, with additional test development required to improve the current coverage percentages.
