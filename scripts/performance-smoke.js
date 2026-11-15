import http from "k6/http";
import { check, sleep } from "k6";

const base = __ENV.BASE_URL || "http://localhost:5000";

export const options = {
  vus: 20,
  duration: "1m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

export default function () {
  const health = http.get(`${base}/api/health`);
  check(health, { "health endpoint returns 200": response => response.status === 200 });

  const listings = http.get(`${base}/api/internships`);
  check(listings, { "internship listing returns 200": response => response.status === 200 });
  sleep(1);
}
