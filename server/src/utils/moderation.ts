export type ModerationResult = { status: "live" } | { status: "rejected"; reason: string };

// Stub for the ML moderation gate from the design: every upload path calls
// this before anything is stored. Replace the body with a real classifier
// call (or an API call to a hosted moderation service) — callers only ever
// depend on the ModerationResult shape, not on how it's decided.
export async function moderate(_buffer: Buffer, _mimeType: string): Promise<ModerationResult> {
  return { status: "live" };
}
