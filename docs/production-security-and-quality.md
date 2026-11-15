# Production security and quality checks

## HTTPS and TLS

Set `NODE_ENV=production` on the API. The API then redirects safe HTTP requests to HTTPS and rejects other HTTP methods with `426`. If TLS terminates at a reverse proxy, set `TRUST_PROXY=1` only when that proxy is controlled by the deployment; otherwise clients could spoof the forwarded protocol. Configure the edge listener with TLS 1.2 as its minimum, valid certificates, and HTTP-to-HTTPS redirection. Do not expose the API directly on the public network when TLS terminates at the proxy. The application cannot choose the proxy's cipher suites or certificate policy; verify those in the hosting environment.

The frontend build refuses a missing or non-HTTPS `VITE_API_URL` in production; the localhost URL is development-only. The checked-in Nginx example is `deploy/nginx/portal-api.conf`. Replace its sample host and certificate paths, keep the Node port private, and set `NODE_ENV=production` plus `TRUST_PROXY=1` on the API only when Nginx is the trusted ingress. Validate the installed config with `nginx -t`.

Run the end-to-end edge check from a machine with Bash, curl, and OpenSSL 1.1.1+:

```sh
API_ORIGIN=https://api.your-domain ./scripts/verify-production-tls.sh
```

It verifies the HTTP redirect, certificate-validated TLS 1.2 handshake, TLS 1.1 rejection, and HSTS header. Save the command output with the release evidence. The repository has no deployed API hostname or certificate, so the live check must run after deployment.

## Load and availability checks

Install k6 in the test environment, start a staging deployment with representative data, and run the bounded smoke test:

```sh
k6 run scripts/performance-smoke.js
```

The script exercises public listing and database-readiness endpoints with 20 virtual users. It requires p95 latency under one second and under 1% failed requests. To evaluate the issue's 5,000-concurrent-user and p90-under-three-seconds criteria, target only an HTTPS staging/preview/QA/test hostname and explicitly acknowledge the load:

```sh
BASE_URL=https://portal-staging.example.test CAPACITY_TEST_ACK=I_APPROVE_5000_VUS k6 run scripts/performance-capacity.js
```

That profile ramps to 5,000 virtual users, holds for five minutes, then ramps down. It measures p90 under three seconds and less than 1% request failures. The script refuses localhost, HTTP, and hostnames that do not look like non-production environments. Run a prolonged capacity test only after confirming staging resources and data are isolated. Record the k6 version, target, commit, date, scenario, and complete summary output; the resulting performance claim applies only to that deployment configuration and test window.

For the 99.5% monthly availability target, configure an external uptime monitor against `/api/health` at five-minute intervals and retain its monthly report. The health endpoint returns 503 when MongoDB is not ready. A monthly 99.5% SLI permits at most 3 hours 36 minutes of downtime in a 30-day month. Record the reporting window, probe interval, total eligible minutes, failed minutes, computed availability, and monitor export/link. This repository contains no production hostname or monitoring credentials, so no live availability result can be produced from this checkout.

## Accessibility review

The app provides labeled search filters, focus-visible styles, mobile layouts, and form/status semantics. Complete and save this review against the deployed frontend at desktop and mobile widths:

- [ ] Keyboard-only use reaches every action in logical order; focus stays visible and no keyboard trap occurs.
- [ ] Screen-reader review confirms page title, heading order, control names, form errors, and status announcements.
- [ ] Text and controls meet WCAG 2.1 AA contrast requirements.
- [ ] At 200% zoom and 320 CSS-pixel viewport width, content remains usable without two-dimensional scrolling (except content that inherently requires it).
- [ ] Automated axe (or equivalent) WCAG 2.1 AA scan has no unresolved critical or serious findings.
- [ ] Desktop and mobile viewport screenshots and the audit report are attached to the release record.

Record the tested commit, URL, browser/device, viewport dimensions, tool/version, date, findings, and remediation links. No deployment URL or browser audit tool is configured here, so the production accessibility sign-off remains a release task.
