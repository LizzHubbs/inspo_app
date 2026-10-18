import { HttpError } from "../../utils/httpError";
import * as ideaRepo from "./idea.repository";
import { Idea } from "./idea.types";

export async function createIdea(input: { ownerId: string; text: string }): Promise<Idea> {
  const text = input.text?.trim();
  if (!text) throw new HttpError(400, "Idea text is required");
  return ideaRepo.insertIdea({ ownerId: input.ownerId, text });
}

export async function listIdeas(limit: number, before?: string): Promise<Idea[]> {
  return ideaRepo.listLiveIdeas(Math.min(limit, 50), before);
}

export async function getIdea(id: string): Promise<Idea> {
  const idea = await ideaRepo.findIdeaById(id);
  if (!idea) throw new HttpError(404, "Idea not found");
  return idea;
}

export async function deleteIdea(id: string, requesterId: string): Promise<void> {
  const idea = await getIdea(id); // 404s if missing
  if (idea.ownerId !== requesterId) {
    throw new HttpError(403, "Only the owner can delete this idea");
  }
  // Soft delete: photos already taken for this idea must keep working.
  await ideaRepo.softDeleteIdea(id);
}
