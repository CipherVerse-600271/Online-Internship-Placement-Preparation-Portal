# Bhavani Sprint 1 corrected contribution

This package is prepared against the supplied Team 12 repository ZIP snapshot. It is not a blind full-project replacement.

## Apply carefully
1. Copy the `backend/scripts/check-project.js`, `backend/src/utils/authorization.js`, `backend/test/authorization.test.js`, `.github/workflows/ci.yml`, and `docs/` files into the cloned repository, preserving existing files not listed here.
2. Apply the two integration notes: add the `check` script to the existing backend package.json; import the helper in authMiddleware.js and remove only its duplicated local authorize implementation. Preserve `protect()` and existing exports.
3. Do not replace backend/package-lock.json, backend/server.js, frontend files, or teammates' files.
4. Review `git diff` before commit. Run backend `npm ci`, `npm run check`, `npm test`; then frontend `npm ci`, `npm run build`, `npm run lint`.
5. Only push after all commands pass on the current branch.

## Scope and limitations
The project structure check is based on the supplied repository snapshot. If teammates have since changed paths, update the required-file list to match the current branch. CI uses GitHub-hosted Node 22 and the existing lockfiles. Documentation templates are blank templates; they do not claim tests/UAT/release approval have been executed.
