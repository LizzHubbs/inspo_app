import { useState } from "react";
import { COLOR, FONT } from "../theme";

// Both fields are optional — leaving one blank clears that aim rather
// than requiring a photo target to set an art one, or vice versa.
export default function GoalModal({ initialPhotoGoal, initialArtGoal, onSubmit, onClose }) {
  const [photoGoal, setPhotoGoal] = useState(initialPhotoGoal ?? "");
  const [artGoal, setArtGoal] = useState(initialArtGoal ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        photoGoal: photoGoal === "" ? null : Number(photoGoal),
        artGoal: artGoal === "" ? null : Number(artGoal),
      });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(36,27,18,0.55)", zIndex: 50 }}>
      <div
        className="w-full max-w-sm p-5"
        style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}`, borderRadius: 2, margin: 16 }}
      >
        <div className="text-base mb-4" style={{ fontFamily: FONT.serif, fontStyle: "italic", color: COLOR.ink }}>Set this year's aims</div>

        <div className="mb-4">
          <label className="block text-[9.5px] mb-1.5" style={{ fontFamily: FONT.sans, letterSpacing: "0.14em", textTransform: "uppercase", color: COLOR.dim }}>
            Photographs to take
          </label>
          <input
            type="number"
            min="1"
            value={photoGoal}
            onChange={(e) => setPhotoGoal(e.target.value)}
            placeholder="e.g. 50"
            className="w-full pb-1.5 text-sm outline-none bg-transparent"
            style={{ borderBottom: `1px solid ${COLOR.ink}`, color: COLOR.ink, fontFamily: FONT.serif, fontStyle: "italic" }}
          />
        </div>

        <div className="mb-2">
          <label className="block text-[9.5px] mb-1.5" style={{ fontFamily: FONT.sans, letterSpacing: "0.14em", textTransform: "uppercase", color: COLOR.dim }}>
            Pieces of art to create
          </label>
          <input
            type="number"
            min="1"
            value={artGoal}
            onChange={(e) => setArtGoal(e.target.value)}
            placeholder="e.g. 12"
            className="w-full pb-1.5 text-sm outline-none bg-transparent"
            style={{ borderBottom: `1px solid ${COLOR.ink}`, color: COLOR.ink, fontFamily: FONT.serif, fontStyle: "italic" }}
          />
        </div>

        {error && <div className="text-xs mb-2 mt-2" style={{ color: COLOR.danger }}>{error}</div>}
        <div className="flex items-center justify-between mt-4">
          <button onClick={onClose} className="text-sm" style={{ color: COLOR.dim }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="text-sm px-4 py-2.5"
            style={{ background: COLOR.accent, color: COLOR.surface, fontFamily: FONT.sans }}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
