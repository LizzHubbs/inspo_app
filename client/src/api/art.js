import { request } from "./client";

export function listArt({ limit = 20, before } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);
  return request(`/art?${params}`);
}

export function listArtForPhoto(photoId) {
  return request(`/photos/${photoId}/art`);
}

export function listArtForArt(artId) {
  return request(`/art/${artId}/art`);
}

export function listArtForIdea(ideaId) {
  return request(`/ideas/${ideaId}/art`);
}

export function getArt(id) {
  return request(`/art/${id}`);
}

export function listArtForUser(userId) {
  return request(`/users/${userId}/art`);
}

export function updateArt(id, { title, description, medium }) {
  return request(`/art/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, medium }),
  });
}

// The museum wall's drag-to-reposition control — separate from updateArt
// (title/description/medium), which is the edit form instead. See
// updatePhotoPosition in api/photos.js for the full reasoning.
export function updateArtPosition(id, { wallX, wallY } = {}) {
  return request(`/art/${id}/position`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallX, wallY }),
  });
}

export function deleteArt(id) {
  return request(`/art/${id}`, { method: "DELETE" });
}

export function loveArt(id) {
  return request(`/art/${id}/love`, { method: "POST" });
}

export function unloveArt(id) {
  return request(`/art/${id}/love`, { method: "DELETE" });
}

// At most one of photoId/artId/ideaId — omit all three to post a piece of
// art on its own. Which one is set picks the endpoint (and so the parent
// relationship the server records).
export function uploadArt({ photoId, artId, ideaId, file, title, description, medium }) {
  const form = new FormData();
  form.append("image", file);
  if (title) form.append("title", title);
  if (description) form.append("description", description);
  if (medium) form.append("medium", medium);
  if (photoId) return request(`/photos/${photoId}/art`, { method: "POST", body: form });
  if (artId) return request(`/art/${artId}/art`, { method: "POST", body: form });
  if (ideaId) return request(`/ideas/${ideaId}/art`, { method: "POST", body: form });
  return request(`/art`, { method: "POST", body: form });
}
