# Test and Code Coverage

## Backend unit tests and coverage

The automated backend coverage command measures JavaScript files exercised by the Node.js test suite. It uses [c8](https://github.com/bcoe/c8), which collects V8 coverage and reports:

- **Statement coverage:** percentage of executable statements run by tests.
- **Branch coverage:** percentage of conditional branches (for example, both outcomes of an \`if\`) run by tests.
- **Function coverage:** percentage of functions invoked by tests.
- **Line coverage:** percentage of executable lines run by tests.

Coverage is a measure of which code ran during tests. It does not prove that the code is correct or that every possible input was tested.

From the \`backend\` directory, run:

\`\`\`bash
npm ci
npm test
npm run coverage
\`\`\`

The command creates \`coverage/index.html\`, \`coverage/lcov.info\`, and \`coverage/coverage-summary.json\`, as well as a terminal summary. Open \`backend/coverage/index.html\` to inspect file-level results.

## Browser end-to-end tests

Playwright tests run the real React frontend in Chromium against the real Express backend and a MongoDB database. They currently cover public portal loading and a complete student registration/sign-in journey. These tests are not mocked API tests.

Local setup requires MongoDB running on \`127.0.0.1:27017\`. In one terminal, start the backend:

\`\`\`powershell
cd backend
$env:NODE_ENV = "test"
$env:EMAIL_MODE = "mock"
$env:JWT_SECRET = "portal-e2e-secret-at-least-thirty-two-characters"
$env:MONGODB_URI = "mongodb://127.0.0.1:27017/portal_e2e"
npm run dev
\`\`\`

In a second terminal, install the browser test runner and start the frontend:

\`\`\`powershell
cd frontend
npm install --no-save --no-package-lock @playwright/test@1.56.1
npx playwright install chromium
$env:VITE_API_URL = "http://127.0.0.1:5000/api"
npm run dev
\`\`\`

In a third terminal, from \`frontend\`, run:

\`\`\`powershell
npm run test:e2e
\`\`\`

The Playwright configuration writes failure screenshots, traces, and an HTML report. GitHub Actions runs these tests using a temporary MongoDB service and uploads the report as the \`portal-e2e-report\` artifact for 14 days.

## GitHub Actions coverage artifacts

The \`Portal CI\` workflow uploads backend coverage as \`backend-coverage-report\`. The separate \`Portal end-to-end tests\` workflow uploads browser test results as \`portal-e2e-report\`. Open the relevant completed workflow run to download its artifact.

## Interpreting results and limitations

A higher coverage percentage means more measured code was executed by tests. Pay particular attention to branch coverage for validation, authorization, and error handling. No minimum percentage threshold is enforced yet; establish a baseline from actual CI results before setting one.

- Code coverage currently measures backend JavaScript only. Playwright exercises selected end-to-end journeys but does not produce frontend code coverage.
- Current browser tests cover the public landing/search shell and student registration/sign-in, not every recruiter, administrator, application, or aptitude workflow.
- Python scripts and deployed-system non-functional properties are not included.
- Passing automated tests do not replace broader security, performance, accessibility, exploratory, or acceptance testing.
