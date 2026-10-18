import { useEffect, useState } from "react";
import GoalModal from "../components/GoalModal";
import { getGoalProgress, setGoal } from "../api/goals";
import { USER_ID } from "../api/client";
import { COLOR, FONT } from "../theme";

// A typeset tally rather than a progress bar — one small mark per unit of
// the goal, filled in as you post. Same underlying count as before, just
// read like a checklist instead of animated.
function Tally({ count, goal }) {
  return (
    <div className="flex gap-[3px] flex-wrap">
      {Array.from({ length: goal }).map((_, i) => (
        <span key={i} style={{ width: 7, height: 16, background: i < count ? COLOR.accent : COLOR.line, flexShrink: 0 }} />
      ))}
    </div>
  );
}

// Only rendered once a goal is actually set (see GoalsView below) — sized
// to be the main content of the screen, not a small stat chip, since a set
// aim is meant to feel like the focal point of this tab.
function AimLine({ label, count, goal }) {
  const remaining = Math.max(0, goal - count);
  const reached = count >= goal;
  return (
    <div className="mb-6">
      <div className="text-base mb-2" style={{ fontFamily: FONT.serif, fontStyle: "italic", color: COLOR.ink }}>
        {count} of {goal} {label}
      </div>
      <Tally count={count} goal={goal} />
      <div
        className="text-[9.5px] mt-2"
        style={{ fontFamily: FONT.sans, letterSpacing: "0.1em", textTransform: "uppercase", color: reached ? COLOR.accent : COLOR.dim }}
      >
        {reached ? "Aim reached" : `${remaining} to go`}
      </div>
    </div>
  );
}

// Fills the tab with an intentionally roomy prompt rather than a small
// empty-list message — this is the first thing a new user sees here, and
// it's the main call to action for the whole tab.
function EmptyState({ onSetGoals }) {
  return (
    <div className="text-center py-16 px-6" style={{ border: `1px dashed ${COLOR.line}` }}>
      <div className="text-lg mb-2" style={{ fontFamily: FONT.serif, fontStyle: "italic", color: COLOR.ink }}>
        You haven't stated any aims yet
      </div>
      <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: COLOR.dim }}>
        Set a target for how many photos to take or pieces of art to make this year, and watch it fill in.
      </p>
      <button onClick={onSetGoals} className="text-sm px-4 py-2.5" style={{ background: COLOR.accent, color: COLOR.surface, fontFamily: FONT.sans }}>
        Set an aim
      </button>
    </div>
  );
}

// The bottom-nav "Aims" tab — a personal yearly target for photos taken
// and art made, not a shared/global thing like the weekly challenge this
// replaced. Progress is never uploaded or stored client-side; it's just
// whatever the server counted this calendar year (see goal.repository.ts),
// so it's always exactly in sync with the work shown in Your Room.
export default function GoalsView() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  function load() {
    return getGoalProgress(USER_ID).then(setProgress);
  }

  useEffect(() => {
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(input) {
    const updated = await setGoal(input);
    setProgress(updated);
  }

  if (error) return <div className="text-sm p-4" style={{ color: COLOR.danger }}>{error}</div>;
  if (loading || !progress) return <div className="text-sm p-4" style={{ color: COLOR.dim }}>Loading…</div>;

  const hasPhotoGoal = !!progress.photoGoal;
  const hasArtGoal = !!progress.artGoal;
  const hasAnyGoal = hasPhotoGoal || hasArtGoal;

  const lead = [
    hasPhotoGoal ? `${progress.photoGoal} photograph${progress.photoGoal === 1 ? "" : "s"}` : null,
    hasArtGoal ? `${progress.artGoal} piece${progress.artGoal === 1 ? "" : "s"} of art` : null,
  ]
    .filter(Boolean)
    .join(" and ");

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-1">
        <div
          className="text-[10px]"
          style={{ fontFamily: FONT.sans, letterSpacing: "0.2em", textTransform: "uppercase", color: COLOR.accent }}
        >
          This year's aims
        </div>
        {hasAnyGoal && (
          <button onClick={() => setShowEdit(true)} className="text-xs" style={{ color: COLOR.accent }}>
            Edit
          </button>
        )}
      </div>

      {hasAnyGoal ? (
        <>
          <p className="text-xs mb-6 mt-3" style={{ fontFamily: FONT.sans, color: COLOR.dim, lineHeight: 1.6 }}>
            You set out to make {lead} this year.
          </p>
          {hasPhotoGoal && <AimLine label="photographs" count={progress.photoCount} goal={progress.photoGoal} />}
          {hasArtGoal && <AimLine label="pieces of art" count={progress.artCount} goal={progress.artGoal} />}
        </>
      ) : (
        <EmptyState onSetGoals={() => setShowEdit(true)} />
      )}

      {showEdit && (
        <GoalModal
          initialPhotoGoal={progress.photoGoal}
          initialArtGoal={progress.artGoal}
          onSubmit={handleSave}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}
