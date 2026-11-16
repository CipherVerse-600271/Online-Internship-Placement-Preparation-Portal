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

1. Start a local MongoDB service. In `backend/.env`, use `MONGODB_URI=mongodb://127.0.0.1:27017/internship_portal_sprint2_test`. Development mode intentionally restricts writes to this local database name.
2. Create a free Mailtrap Email Sandbox. In its **Integration → SMTP** settings, copy the SMTP username and password. Mailtrap's sandbox captures test messages for review and does not deliver them to student inboxes. The Free sandbox has a limited message allowance; check the [current plan limits](https://mailtrap.io/pricing/?tab=email-sandbox).
3. Set `EMAIL_MODE=gmail`, `SMTP_HOST=sandbox.smtp.mailtrap.io`, `SMTP_PORT=2525`, `EMAIL_USER` and `EMAIL_APP_PASSWORD` in `backend/.env`. Despite the variable name, the custom SMTP host routes messages to Mailtrap. Set `EMAIL_FROM=demo@internship-portal.test` and `API_BASE_URL=http://localhost:5000`.
4. Restart the API and frontend. Register a new student account, open the message in the Mailtrap sandbox, and use its verification link. For a local demo, open the link on the same computer running the API. Then sign in with the registered email and password.

Do not leave `EMAIL_MODE=mock` enabled when you need to inspect messages in Mailtrap; mock mode does not send messages to the sandbox. Keep SMTP credentials in `.env`, never in Git or chat. Create fresh student records for testing; accounts registered before email verification was enabled are already verified and will not receive a new verification message.

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
