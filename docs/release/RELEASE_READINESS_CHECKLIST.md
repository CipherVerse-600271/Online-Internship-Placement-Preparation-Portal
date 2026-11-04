# Release Readiness Checklist

**Release / sprint:**  
**Build commit SHA:**  
**Environment:**  
**Review date:**  

## Build owner — Bhavani Shahapur

- [ ] Clean dependency install succeeds (`npm ci`) for backend and frontend.
- [ ] Backend project structure check passes (`npm run check`).
- [ ] Backend automated tests pass (`npm test`).
- [ ] Backend JavaScript syntax check passes.
- [ ] Frontend production build passes (`npm run build`).
- [ ] Frontend lint passes (`npm run lint`).
- [ ] GitHub Actions checks pass for the release commit.
- [ ] Test environment points to an isolated test database and uses anonymised data.
- [ ] No `.env`, secrets, access tokens, or personal data are included in the diff.
- [ ] All release-blocking defects are fixed and regression-tested, or release is blocked.
- [ ] Known limitations and deviations are recorded.

## Product Owner / Placement Coordinator — Bhavani Shahapur

- [ ] Acceptance criteria reviewed against the SRS baseline.
- [ ] UAT scenarios executed and evidence reviewed.
- [ ] SRS Section 6 exit criteria assessed.
- [ ] RTM status reviewed with QA Lead and test engineers.
- [ ] Outstanding defects and accepted deviations documented.
- [ ] Working-product demonstration prepared from this exact build.

## Team / QA sign-off

- [ ] QA Lead confirms test execution summary and exit criteria.
- [ ] Functional and NFR/Security test owners provide their results.
- [ ] Repository owner has reviewed and approved the PR.
- [ ] Sprint demonstration video is uploaded to the repository as required.
- [ ] Release decision recorded: **Not reviewed / Ready / Not ready**.

Build Owner: Bhavani Shahapur — Date:  
Product Owner: Bhavani Shahapur — Date:  
QA Lead: Benita Wilson — Date:  
Repository owner / reviewer: — Date:

*Checking a box means evidence has been reviewed. Do not mark an item complete solely because a workflow or document exists.*
