import { request } from "./client";

export function listIdeas({ limit = 20, before } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);
  return request(`/ideas?${params}`);
}

export function getIdea(id) {
  return request(`/ideas/${id}`);
}

export function deleteIdea(id) {
  return request(`/ideas/${id}`, { method: "DELETE" });
}

export function createIdea({ text }) {
  return request(`/ideas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}
