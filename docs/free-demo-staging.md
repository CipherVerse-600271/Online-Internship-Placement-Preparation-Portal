# Free demo staging

This demo deploys the React frontend and Express API to Render's free static-site and web-service plans, with a separate MongoDB Atlas free cluster and Mailtrap Email Sandbox. It needs no custom domain. Render assigns HTTPS URLs to the services.

## Set up the required free accounts

1. Create a Render account and connect the GitHub repository. Do not add a payment method or select a paid plan.
2. In MongoDB Atlas, create a free cluster for demo data, create a database user, and copy the application connection string. Add the outbound IP ranges shown in Render under the API service's **Connect → Outbound** panel to the Atlas network access list. Keep the database password only in the Render environment variable form.
3. In Mailtrap, create an Email Sandbox and copy its SMTP username and password. Sandbox messages are captured for demo use and are not delivered to real inboxes.
4. In Render, create a Blueprint from this repository's `render.yaml`. Enter the Atlas URI and Mailtrap sandbox credentials for `MONGODB_URI`, `EMAIL_USER`, and `EMAIL_APP_PASSWORD`. The Blueprint sets the API compute plan to `free` and generates a JWT secret.
5. Wait for both services to deploy. Open the frontend URL; use the Mailtrap sandbox to view the verification email and its link. The API health check is `https://<api-host>/api/health`.

Render's free API service sleeps after 15 minutes without traffic, takes about a minute to wake, can restart, and cannot scale past one instance. The Atlas free cluster is intended for low-throughput demos. This is suitable for a class demo and functional checks, but it cannot produce valid evidence for 5,000 concurrent users or a 99.5% monthly availability target. Do not run the 5,000-user profile against this free demo. Issues #10 and #20 should remain open for those environment-dependent acceptance results.

## Demo data and account safety

- Use only synthetic student, recruiter, and internship records.
- Keep the Atlas connection string and Mailtrap credentials out of Git and chat; enter them directly in Render.
- Do not use real resumes, student records, email addresses, or production credentials.
- Delete the demo database and services when the class demo is over if they are no longer needed.

## Run a local demo with verification emails

1. Start local MongoDB. In `backend/.env`, use `MONGODB_URI=mongodb://127.0.0.1:27017/internship_portal_sprint2_test`.
2. Reuse the same Gmail sender address and SMTP app password that delivered mail in your earlier review. Set `EMAIL_MODE=gmail`, `EMAIL_USER`, and `EMAIL_APP_PASSWORD`. Leave `SMTP_HOST` and `SMTP_PORT` unset so the backend uses Gmail's built-in transport. If your previous credentials are still in `.env`, keep them; do not create a Mailtrap account.
3. Set `EMAIL_FROM` to that sender address and `API_BASE_URL=http://localhost:5000`. Restart the API and frontend.
4. Register a new student using the recipient email you want the verification message sent to. The backend sends the message from the configured sender to that student's email. Open the verification link on the same computer running the local API, then sign in.

The email sender settings are entered once in the backend environment. Each student supplies their own recipient email in the registration form. Keep sender credentials in `.env`, never in Git or chat. Student records registered before verification was enabled are already verified; use a new email and SRN to demonstrate the email flow.

## Local deployment checks

After the API deploys, run the TLS verification script from the repository root using Bash, curl, and OpenSSL 1.1.1 or newer:

```sh
API_ORIGIN=https://<api-host> ./scripts/verify-production-tls.sh
```

Use the staging API URL for the smoke test. The first request may hit the free-service wake-up delay; rerun once it is awake:

```sh
BASE_URL=https://<api-host> k6 run scripts/performance-smoke.js
```

The capacity profile is intentionally not included in the free demo steps because free Render services cannot scale and may throttle or suspend under unusually high outbound traffic.
