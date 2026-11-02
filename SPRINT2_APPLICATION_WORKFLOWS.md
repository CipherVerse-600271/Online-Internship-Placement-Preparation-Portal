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
5. Register/sign in. Student registration requires the official PESU student email verification flow. Recruiter accounts must be approved before they can sign in.
6. Sign in as a student, apply to an internship with a shareable resume URL, then sign in as the owning recruiter and update the status. Sign back in as the student to verify the application and notification.

## Manual acceptance checks

- Student A cannot retrieve Student B's applications or notifications.
- Student A cannot submit a duplicate application for the same internship.
- Recruiter A cannot view or update applications for Recruiter B's internships.
- Each allowed status is saved and appears after refreshing the student's application list.
- A status change creates a notification containing the internship title and new status; selecting Mark as read persists the read flag.
