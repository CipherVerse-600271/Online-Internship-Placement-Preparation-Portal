# Production security and quality checks

## HTTPS and TLS

Set `NODE_ENV=production` on the API. The API then redirects safe HTTP requests to HTTPS and rejects other HTTP methods with `426`. If TLS terminates at a reverse proxy, set `TRUST_PROXY=1` only when that proxy is controlled by the deployment; otherwise clients could spoof the forwarded protocol. Configure the edge listener with TLS 1.2 as its minimum, valid certificates, and HTTP-to-HTTPS redirection. Do not expose the API directly on the public network when TLS terminates at the proxy. The application cannot choose the proxy's cipher suites or certificate policy; verify those in the hosting environment.

The frontend build now refuses a missing or non-HTTPS `VITE_API_URL` in production; the localhost URL is development-only. The checked-in Nginx example is `deploy/nginx/portal-api.conf`. Replace its sample host and certificate paths, keep the Node port private, and set `NODE_ENV=production` plus `TRUST_PROXY=1` on the API only when Nginx is the trusted ingress. Validate the installed config with `nginx -t`, then verify the live endpoint with `openssl s_client -connect api.your-domain:443 -tls1_2` and confirm a TLS 1.1 handshake fails. A real certificate and public hostname must be supplied by the deployment.

## Load and availability checks

Install k6 in the test environment, start a staging deployment with representative data, and run the bounded smoke test:

```sh
k6 run scripts/performance-smoke.js
```

The script exercises public listing and database-readiness endpoints with 20 virtual users. To run the requested capacity profile, target only an HTTPS staging/preview/QA/test hostname and explicitly acknowledge the load:

```sh
BASE_URL=https://portal-staging.example.test CAPACITY_TEST_ACK=I_APPROVE_5000_VUS k6 run scripts/performance-capacity.js
```

That profile ramps to 5,000 virtual users, holds for five minutes, then ramps down. It measures the SRS p90 under three seconds and less than 1% request failures. The script refuses localhost, HTTP, and hostnames that do not look like non-production environments. Run a prolonged capacity test only after confirming staging resources and data are isolated. The resulting performance claim applies only to the recorded deployment configuration and test window.

For the 99.5% monthly availability target, configure an external uptime monitor against `/api/health` at five-minute intervals and retain its monthly report. The health endpoint now returns 503 when MongoDB is not ready. A monthly 99.5% SLI permits at most about 3 hours 39 minutes of downtime in a 30-day month. This repository contains no production hostname or monitoring credentials, so no live availability result can be produced from this checkout.

## Accessibility review

The app now provides labeled search filters, focus-visible styles, mobile layouts, and form/status semantics for the new admin and aptitude interfaces. Before release, test the production frontend with keyboard-only navigation and a screen reader, verify heading order, all form labels, status announcements, color contrast, zoom at 200%, and responsive reflow at 320 CSS pixels. Run an automated WCAG 2.1 AA audit (for example, axe DevTools) against the deployed build. There is no browser automation dependency or deployment URL in this repository, so a complete WCAG conformance result still requires that release check.
