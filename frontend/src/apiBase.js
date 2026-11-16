const configuredApiBase = import.meta.env.VITE_API_URL;
const configuredApiOrigin = import.meta.env.VITE_API_ORIGIN;
const apiBase = configuredApiBase || (configuredApiOrigin
  ? `${configuredApiOrigin.replace(/\/+$/, "")}/api`
  : undefined);

if (import.meta.env.PROD) {
  if (!apiBase) throw new Error("VITE_API_URL or VITE_API_ORIGIN must be configured for production.");
  let parsed;
  try { parsed = new URL(apiBase); } catch { throw new Error("The production API URL must be valid."); }
  if (parsed.protocol !== "https:") throw new Error("The production API URL must use HTTPS.");
}

export const API_BASE = (apiBase || "http://localhost:5000/api").replace(/\/+$/, "");
