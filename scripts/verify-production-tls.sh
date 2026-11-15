#!/usr/bin/env bash
set -euo pipefail

origin="${API_ORIGIN:-}"
if [[ ! "$origin" =~ ^https://([A-Za-z0-9.-]+)(:[0-9]+)?/?$ ]]; then
  echo "Set API_ORIGIN to the deployed HTTPS origin, for example https://api.example.com" >&2
  exit 2
fi
host="${BASH_REMATCH[1]}"
port="${BASH_REMATCH[2]:-:443}"
port="${port#:}"

echo "Checking HTTP to HTTPS redirect for $host..."
redirect="$(curl --silent --show-error --output /dev/null --write-out '%{http_code} %{redirect_url}' "http://$host/api/health")"
status="${redirect%% *}"
location="${redirect#* }"
if [[ "$status" != 301 && "$status" != 302 && "$status" != 307 && "$status" != 308 ]] || [[ "$location" != https://* ]]; then
  echo "Expected an HTTP redirect to HTTPS, received: $redirect" >&2
  exit 1
fi

echo "Checking certificate and TLS 1.2 handshake..."
tls12="$(openssl s_client -connect "$host:$port" -servername "$host" -verify_return_error -tls1_2 -brief </dev/null 2>&1)" || {
  echo "$tls12" >&2
  echo "TLS 1.2 handshake or certificate verification failed." >&2
  exit 1
}
if ! grep -Eq 'Protocol version: TLSv1\.2|Protocol *: TLSv1\.2' <<<"$tls12" || ! grep -Eq 'Verification: OK|Verify return code: 0 \(ok\)' <<<"$tls12"; then
  echo "$tls12" >&2
  echo "Could not confirm a verified TLS 1.2 handshake." >&2
  exit 1
fi

echo "Checking TLS 1.1 is refused..."
tls11="$(openssl s_client -connect "$host:$port" -servername "$host" -tls1_1 -brief </dev/null 2>&1 || true)"
if grep -Eq 'Protocol version: TLSv1\.1|Protocol *: TLSv1\.1' <<<"$tls11"; then
  echo "The server accepted TLS 1.1." >&2
  exit 1
fi
if grep -qi 'no protocols available' <<<"$tls11"; then
  echo "$tls11" >&2
  echo "This OpenSSL build cannot attempt TLS 1.1, so the server check is inconclusive." >&2
  exit 2
fi

echo "Checking HSTS response header..."
headers="$(curl --silent --show-error --dump-header - --output /dev/null "$origin/api/health")"
if ! grep -Eiq '^strict-transport-security:[[:space:]]*max-age=[1-9][0-9]*' <<<"$headers"; then
  echo "The HTTPS response is missing a valid Strict-Transport-Security header." >&2
  exit 1
fi

echo "Production TLS checks passed for $host:$port."
