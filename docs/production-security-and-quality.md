# Production security and quality checks

## HTTPS and TLS

Set `NODE_ENV=production` on the API. The API then redirects safe HTTP requests to HTTPS and rejects other HTTP methods with `426`. If TLS terminates at a reverse proxy, set `TRUST_PROXY=1` only when that proxy is controlled by the deployment; otherwise clients could spoof the forwarded protocol. Configure the edge listener with TLS 1.2 as its minimum, valid certificates, and HTTP-to-HTTPS redirection. Do not expose the API directly on the public network when TLS terminates at the proxy. The application cannot choose the proxy's cipher suites or certificate policy; verify those in the hosting environment.

The frontend must use an HTTPS `VITE_API_URL` in production. The localhost URL is only a development fallback.

## Load and availability checks

Install k6 in the test environment, start a staging deployment with representative data, and run:

```sh
k6 run scripts/performance-smoke.js
```

The script exercises public listing and health endpoints with a bounded 20 virtual users. It checks availability and latency thresholds suitable for a smoke test. Run a separate, reviewed capacity test before claiming a concurrent-user or uptime target; results depend on the deployment, database, and network and are not inferred from a local run.

## Accessibility review

Before release, test the production frontend with keyboard-only navigation and a screen reader, verify visible focus, heading order, form labels, status announcements, color contrast, zoom at 200%, and responsive reflow at 320 CSS pixels. Automated browser audits should be run against the deployed build as part of release QA. This repository has no browser accessibility runner or deployment URL, so a production conformance result cannot be asserted here.
