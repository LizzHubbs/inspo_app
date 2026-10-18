import { request } from "./client";

export function getGoalProgress(userId) {
  return request(`/goals/${userId}`);
}

export function setGoal({ photoGoal, artGoal }) {
  return request(`/goals`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoGoal, artGoal }),
  });
}
