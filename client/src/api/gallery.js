import { request } from "./client";

// Public — anyone viewing a profile needs the owner's room theme to render
// their museum room correctly.
export function getGallerySettings(userId) {
  return request(`/gallery-settings/${userId}`);
}

// Always sets the requester's own settings.
export function updateGallerySettings({ roomTheme, maxPieces }) {
  return request(`/gallery-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomTheme, maxPieces }),
  });
}
