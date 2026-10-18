import { request } from "./client";

// q is a backend search over title + description (no more client-side tag
// filtering — see SearchView.jsx) and is mutually exclusive with before:
// a search is a relevance-ranked read, not a cursor-paginated timeline.
export function listPhotos({ limit = 20, before, q } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (q) params.set("q", q);
  else if (before) params.set("before", before);
  return request(`/photos?${params}`);
}

export function getPhoto(id) {
  return request(`/photos/${id}`);
}

export function uploadPhoto({ file, title, description, ideaId }) {
  const form = new FormData();
  form.append("image", file);
  if (title) form.append("title", title);
  if (description) form.append("description", description);
  if (ideaId) form.append("ideaId", ideaId);
  // Don't set Content-Type manually — the browser sets the multipart
  // boundary itself when the body is a FormData instance.
  return request(`/photos`, { method: "POST", body: form });
}

export function listPhotosForIdea(ideaId) {
  return request(`/ideas/${ideaId}/photos`);
}

export function listPhotosForUser(userId) {
  return request(`/users/${userId}/photos`);
}

export function updatePhoto(id, { title, description }) {
  return request(`/photos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });
}

// The museum wall's drag-to-reposition control — separate from updatePhoto
// (title/description), which is the edit form instead. wallX/wallY can be
// omitted (unchanged), or explicit null (un-place, back to auto-layout).
export function updatePhotoPosition(id, { wallX, wallY } = {}) {
  return request(`/photos/${id}/position`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallX, wallY }),
  });
}

export function deletePhoto(id) {
  return request(`/photos/${id}`, { method: "DELETE" });
}

// "Inzzpired" mode — see PhotoWorkspace.jsx. Own list only, no user id
// param: the server always scopes these to whoever's asking.
export function startWorkingOn(id) {
  return request(`/photos/${id}/working`, { method: "POST" });
}

export function stopWorkingOn(id) {
  return request(`/photos/${id}/working`, { method: "DELETE" });
}

export function listWorkingPhotos() {
  return request(`/photos/working`);
}

export function lovePhoto(id) {
  return request(`/photos/${id}/love`, { method: "POST" });
}

export function unlovePhoto(id) {
  return request(`/photos/${id}/love`, { method: "DELETE" });
}
