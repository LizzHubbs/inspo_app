import { useState } from "react";
import { COLOR, FONT } from "../theme";

// Text-only counterpart to UploadModal — a prompt has no image, just text,
// so there's no file input or multipart body here.
export default function IdeaModal({ onSubmit, onClose }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (!text.trim()) {
      setError("Write the prompt first");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(text.trim());
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
        style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}`, borderRadius: 2, margin: 16, maxHeight: "85vh", overflowY: "auto" }}
      >
        <div className="text-base mb-4" style={{ fontFamily: FONT.serif, fontStyle: "italic", color: COLOR.ink }}>Submit a prompt</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A boat on a stormy sea…"
          rows={4}
          className="w-full text-sm mb-2 resize-none outline-none bg-transparent"
          style={{ color: COLOR.ink, fontFamily: FONT.serif, fontStyle: "italic", lineHeight: "24px" }}
        />
        {error && <div className="text-xs mb-2" style={{ color: COLOR.danger }}>{error}</div>}
        <div className="flex items-center justify-between mt-3">
          <button onClick={onClose} className="text-sm" style={{ color: COLOR.dim }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="text-sm px-4 py-2.5"
            style={{ background: COLOR.accent, color: COLOR.surface, fontFamily: FONT.sans }}
          >
            {busy ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
