const configuredApiBase = import.meta.env.VITE_API_URL;

if (import.meta.env.PROD) {
  if (!configuredApiBase) throw new Error("VITE_API_URL must be configured for production.");
  let parsed;
  try { parsed = new URL(configuredApiBase); } catch { throw new Error("VITE_API_URL must be a valid HTTPS URL."); }
  if (parsed.protocol !== "https:") throw new Error("VITE_API_URL must use HTTPS in production.");
}

export const API_BASE = (configuredApiBase || "http://localhost:5000/api").replace(/\/+$/, "");
