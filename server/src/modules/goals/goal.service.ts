import { HttpError } from "../../utils/httpError";
import * as goalRepo from "./goal.repository";
import { GoalProgress } from "./goal.types";

function parseTarget(value: unknown, label: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new HttpError(400, `${label} must be a positive whole number`);
  }
  return n;
}

export async function getProgress(userId: string): Promise<GoalProgress> {
  const [goal, photoCount, artCount] = await Promise.all([
    goalRepo.getGoal(userId),
    goalRepo.countPhotosThisYear(userId),
    goalRepo.countArtThisYear(userId),
  ]);
  return { photoGoal: goal.photoGoal, photoCount, artGoal: goal.artGoal, artCount };
}

export async function setGoal(
  userId: string,
  input: { photoGoal: unknown; artGoal: unknown }
): Promise<GoalProgress> {
  const photoGoal = parseTarget(input.photoGoal, "Photo goal");
  const artGoal = parseTarget(input.artGoal, "Art goal");
  await goalRepo.setGoal(userId, { photoGoal, artGoal });
  return getProgress(userId);
}
