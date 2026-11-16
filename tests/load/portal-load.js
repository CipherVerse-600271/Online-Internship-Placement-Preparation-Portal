import http from "k6/http";
import { check } from "k6";
import { sleep } from "k6";

const baseUrl = (__ENV.BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
const targetPath = __ENV.TARGET_PATH || "/api/health";
const vus = Number(__ENV.VUS || 10);
const duration = __ENV.DURATION || "1m";

export const options = {
  scenarios: {
    portal_smoke_load: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "15s", target: Math.min(vus, 10) },
        { duration, target: vus },
        { duration: "10s", target: 0 }
      ],
      gracefulRampDown: "10s"
    }
  },
  thresholds: {
    http_req_duration: ["p(90)<3000"],
    http_req_failed: ["rate<0.005"],
    checks: ["rate>0.995"]
  }
};

export default function () {
  const response = http.get(`${baseUrl}${targetPath}`, {
    tags: { endpoint: targetPath }
  });
  check(response, {
    "health endpoint returns HTTP 200": (r) => r.status === 200
  });
  sleep(0.2);
}
