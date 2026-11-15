import http from "k6/http";
import { check, sleep } from "k6";

const base = __ENV.BASE_URL || "";
const ack = __ENV.CAPACITY_TEST_ACK || "";

if (ack !== "I_APPROVE_5000_VUS") {
  throw new Error("Set CAPACITY_TEST_ACK=I_APPROVE_5000_VUS after confirming this is a disposable/staging deployment.");
}
if (!base) throw new Error("Set BASE_URL to the HTTPS staging origin.");
let target;
try { target = new URL(base); } catch { throw new Error("BASE_URL must be a valid URL."); }
if (target.protocol !== "https:" || !/(staging|stage|preview|qa|test)/i.test(target.hostname)) {
  throw new Error("Capacity test requires an HTTPS staging/preview/QA/test hostname; production and localhost are refused.");
}

export const options = {
  discardResponseBodies: true,
  maxVUs: 5000,
  stages: [
    { duration: "1m", target: 100 },
    { duration: "2m", target: 1000 },
    { duration: "3m", target: 2500 },
    { duration: "5m", target: 5000 },
    { duration: "5m", target: 5000 },
    { duration: "5m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(90)<3000"],
    checks: ["rate>0.99"],
  },
};

export default function () {
  const health = http.get(`${base.replace(/\/+$/, "")}/api/health`);
  check(health, { "readiness returns 200": response => response.status === 200 });
  const listings = http.get(`${base.replace(/\/+$/, "")}/api/internships`);
  check(listings, { "internship search returns 200": response => response.status === 200 });
  sleep(3);
}
