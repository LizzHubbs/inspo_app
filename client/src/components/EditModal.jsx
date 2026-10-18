import { useState } from "react";
import { MEDIUMS } from "../constants";
import { COLOR, FONT } from "../theme";

// showMedium is only true for art — a photo's medium is implicitly and
// always "Photograph" (see UploadModal.jsx), nothing to edit there.
export default function EditModal({ initialTitle, initialDescription, initialMedium, showMedium = false, onSubmit, onClose }) {
  const [caption, setCaption] = useState(initialTitle || "");
  const [description, setDescription] = useState(initialDescription || "");
  const [medium, setMedium] = useState(initialMedium || MEDIUMS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ title: caption, description, medium: showMedium ? medium : undefined });
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
        <div className="text-base mb-4" style={{ fontFamily: FONT.serif, fontStyle: "italic", color: COLOR.ink }}>Edit</div>

        <div className="mb-4">
          <label className="block text-[9.5px] mb-1.5" style={{ fontFamily: FONT.sans, letterSpacing: "0.14em", textTransform: "uppercase", color: COLOR.dim }}>
            Title
          </label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full pb-1.5 text-sm outline-none bg-transparent"
            style={{ borderBottom: `1px solid ${COLOR.ink}`, color: COLOR.ink, fontFamily: FONT.serif, fontStyle: "italic" }}
          />
        </div>

        {showMedium && (
          <div className="mb-4">
            <label className="block text-[9.5px] mb-2" style={{ fontFamily: FONT.sans, letterSpacing: "0.14em", textTransform: "uppercase", color: COLOR.dim }}>
              Medium
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {MEDIUMS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMedium(m)}
                  className="text-[10px] px-2.5 py-1"
                  style={{ fontFamily: FONT.sans, borderRadius: 999, border: `1px solid ${medium === m ? COLOR.accent : COLOR.line}`, color: medium === m ? COLOR.accent : COLOR.dim }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-[9.5px] mb-1.5" style={{ fontFamily: FONT.sans, letterSpacing: "0.14em", textTransform: "uppercase", color: COLOR.dim }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full text-sm resize-none outline-none bg-transparent"
            style={{ color: COLOR.ink, lineHeight: "22px" }}
          />
        </div>

        {error && <div className="text-xs mb-2" style={{ color: COLOR.danger }}>{error}</div>}
        <div className="flex items-center justify-between">
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
