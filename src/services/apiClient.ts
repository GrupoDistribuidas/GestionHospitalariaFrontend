import { API_BASE } from "../config/api";

export function getApiBase() {
  return API_BASE;
}

export function getAuthHeaders(contentType = "application/json"): HeadersInit {
  const token = localStorage.getItem("authToken");
  const headers: HeadersInit = {};
  if (contentType) headers["Content-Type"] = contentType;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function safeFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, options);

  // Some backends (ApiGateway/gRPC translation) may return numeric gRPC codes as the HTTP status
  // (for example: 13). Normalize any non-standard status (<100) into a 500 response while
  // keeping the original body so callers can extract the real error message.
  if (typeof res.status === "number" && res.status > 0 && res.status < 100) {
    try {
      const bodyText = await res.text();
      // Recreate a Response with normalized status so downstream code sees an HTTP 500
      return new Response(bodyText, {
        status: 500,
        statusText: "Internal Server Error",
        headers: res.headers,
      });
    } catch (err) {
      // If something goes wrong reading the body, still return a generic 500
      return new Response(null, {
        status: 500,
        statusText: "Internal Server Error",
      });
    }
  }

  return res;
}
