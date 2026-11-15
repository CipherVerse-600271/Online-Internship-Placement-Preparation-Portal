# Sprint 2 — Applications, Tracking and Notifications

This branch integrates the authentication branch with the internship-listings module and implements GitHub stories #26, #27 and #28.

## Backend routes

All routes below are mounted by `backend/src/server.js`. Protected routes require
`Authorization: Bearer <JWT>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/applications` | Student | Submit an application |
| GET | `/api/applications/mine` | Student | List only the signed-in student's applications |
| GET | `/api/applications/recruiter` | Recruiter/Admin | List applications for internships owned by the recruiter (admin can view all) |
| PATCH | `/api/applications/:id/status` | Recruiter/Admin | Change status to Pending, Shortlisted, Rejected or Accepted |
| GET | `/api/notifications` | Student | List the signed-in student's notifications |
| PATCH | `/api/notifications/:id/read` | Student | Mark an owned notification as read |

### Submit application body

```json
{
  "internshipId": "<MongoDB internship id>",
  "resumeUrl": "https://drive.google.com/...",
  "resumeName": "Resume.pdf",
  "coverLetter": "Optional cover letter"
}
```

Resume links must be HTTP or HTTPS. The application stores the link and file name; the user should configure the link so the recruiter can access it.

### Update status body

```json
{ "status": "Shortlisted" }
```

A notification is created only when the status actually changes. Application ownership is checked against the internship's recruiter ID before a recruiter can update it.

## Data model and security

- Applications reference the student User and Internship documents.
- A compound unique index prevents the same student applying twice to one internship.
- New internships record the authenticated recruiter as their owner.
- Students can query only their own applications and notifications.
- Recruiters can review only applications for internships they own.
- Status changes are persisted in MongoDB and create a student notification.

## Run locally

1. In `backend`, install dependencies with `npm install`.
2. Configure `.env` with `MONGODB_URI`, `JWT_SECRET`, and any email settings required by the existing authentication module.
3. Start the API with `npm run dev` (or `npm start`).
4. In `frontend`, run `npm install` and `npm run dev`.
5. Register/sign in. Students can register with any valid email address without student email verification. Recruiters must verify their email and receive admin approval before they can sign in.
6. Sign in as a student, apply to an internship with a shareable resume URL, then sign in as the owning recruiter and update the status. Sign back in as the student to verify the application and notification.

## Manual acceptance checks

- Student A cannot retrieve Student B's applications or notifications.
- Student A cannot submit a duplicate application for the same internship.
- Recruiter A cannot view or update applications for Recruiter B's internships.
- Each allowed status is saved and appears after refreshing the student's application list.
- A status change creates a notification containing the internship title and new status; selecting Mark as read persists the read flag.

## Current Sprint 2 integration behavior

- Student and recruiter registration and email verification use the auth routes. Recruiters remain pending until a separate admin approves them; there is no public admin registration route.
- An admin cannot approve a recruiter until the recruiter has verified their email; rejection remains available for pending accounts.
- Admin approval endpoints are mounted under /api/admin and require an authenticated admin role. The development admin is provisioned only by backend/scripts/createLocalAdmin.js; the script requires NODE_ENV=development, a local MongoDB URI naming exactly internship_portal_sprint2_test, and interactive prompts.
- Public internship listings support search, skill, location, minStipend, maxStipend, and duration. Applications are rejected for inactive internships and deadlines before the current UTC day.
- Internship creation requires a UUID Idempotency-Key. The key is tied to the recruiter and canonical request payload; repeating the same request retries matching notification delivery. The schema declares unique sparse indexes for Internship.idempotencyKey and Notification.eventKey.
- Application status notification and email retries use separate pending fields. Email retries use a bounded five-minute claim lease. Delivery is at least once: a process failure after an email provider accepts a message but before MongoDB records success can lead to a duplicate on retry.
- Configure local runs with NODE_ENV=development, EMAIL_MODE=mock, and MONGODB_URI pointing to the local internship_portal_sprint2_test database. Non-production backend startup rejects remote hosts, SRV URIs, and any other database name before connecting. Mock messages are kept in process memory; verification links are deliberately not written to logs.
- The active backend startup waits for Internship.init() and Notification.init() before listening. If initialization rejects, it reports the failure and does not start the HTTP listener.

## Verification record for this integration review

- Backend JavaScript syntax check: PASS for all 16 backend JavaScript files outside node_modules.
- Frontend lint: completed with two react(set-state-in-effect) warnings in frontend/src/App.jsx (lines 109-110); no lint errors were reported.
- Frontend production build: PASS using Vite's runner config loader and a temporary output directory.
- git diff --check: PASS after line-ending normalization of the startup file.
- Backend automated tests: NOT TESTED; the backend test script is a placeholder that exits with no test specified.
- Database index inspection and end-to-end tests: BLOCKED because MONGODB_URI was not configured in the process environment. No MongoDB connection or database operation was performed. No feature test result is implied by the static checks above.
