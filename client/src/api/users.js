import { request } from "./client";

export function searchUsers(query) {
  const params = new URLSearchParams({ q: query });
  return request(`/users?${params}`);
}

export function getUser(id) {
  return request(`/users/${id}`);
}

export function listFriends(userId) {
  return request(`/users/${userId}/friends`);
}

export function addFriend(userId) {
  return request(`/users/${userId}/friends`, { method: "POST" });
}

export function removeFriend(userId) {
  return request(`/users/${userId}/friends`, { method: "DELETE" });
}

export function listBlocked() {
  return request(`/blocks`);
}

export function blockUser(userId) {
  return request(`/blocks/${userId}`, { method: "POST" });
}

export function unblockUser(userId) {
  return request(`/blocks/${userId}`, { method: "DELETE" });
}
