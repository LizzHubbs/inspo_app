// Every API call in this app funnels through request() below — one place
// to add auth headers, one place to see how errors are shaped.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
export const USER_ID = import.meta.env.VITE_USER_ID || "";

export async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      // Stand-in for real auth — matches the server's placeholder
      // x-user-id middleware. Replace both sides together later.
      ...(USER_ID ? { "x-user-id": USER_ID } : {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
