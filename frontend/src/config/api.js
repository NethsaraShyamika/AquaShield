/**
 * API base URL including `/api`.
 * - Local dev: omit VITE_API_BASE_URL so requests use `/api` (Vite proxies to the backend).
 * - Production (Vercel): set VITE_API_BASE_URL=https://your-service.onrender.com/api
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base}${p}`;
}

/** Backend origin (scheme + host) for OAuth redirects and absolute upload URLs. */
export function getBackendOrigin() {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (base && /^https?:\/\//i.test(base)) {
    try {
      const normalized = base.replace(/\/$/, "");
      const url = new URL(normalized.endsWith("/api") ? normalized : `${normalized}/api`);
      return url.origin;
    } catch {
      /* ignore */
    }
  }
  return "http://localhost:5000";
}
