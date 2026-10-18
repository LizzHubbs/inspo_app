import { useRef, useState } from "react";
import { MEDIUMS } from "../constants";
import { COLOR, FONT } from "../theme";

// One form for everything that used to be a "photo vs art" choice —
// medium is what decides that now (see callers: "Photograph" routes to a
// Photo, anything else to a piece of art). No tags anywhere; title and
// description are what the backend searches instead.
export default function UploadModal({ title, onSubmit, onClose }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [medium, setMedium] = useState(MEDIUMS[0]);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit() {
    if (!file) {
      setError("Choose a photo first");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ file, title: caption, medium, description });
      onClose();
    } catch (e) {
      // Server errors land here as plain messages — see api/client.js.
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
        <div className="text-base mb-4" style={{ fontFamily: FONT.serif, fontStyle: "italic", color: COLOR.ink }}>{title}</div>

        {/* A big tappable card instead of the tiny native "Choose File"
            button — much easier to hit on a phone. No `capture` attribute
            on the input, so the native picker offers the photo library
            (not just the camera) on iOS/Android. */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 mb-5 overflow-hidden"
          style={{
            border: `1px dashed ${COLOR.line}`,
            height: previewUrl ? 180 : 100,
            padding: previewUrl ? 0 : 12,
          }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs" style={{ fontFamily: FONT.sans, color: COLOR.dim }}>Attach the work</span>
          )}
        </button>

        <div className="mb-5">
          <label
            className="block text-[9.5px] mb-1.5"
            style={{ fontFamily: FONT.sans, letterSpacing: "0.14em", textTransform: "uppercase", color: COLOR.dim }}
          >
            Title
          </label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full pb-1.5 text-sm outline-none bg-transparent"
            style={{ borderBottom: `1px solid ${COLOR.ink}`, color: COLOR.ink, fontFamily: FONT.serif, fontStyle: "italic" }}
          />
        </div>

        <div className="mb-5">
          <label
            className="block text-[9.5px] mb-2"
            style={{ fontFamily: FONT.sans, letterSpacing: "0.14em", textTransform: "uppercase", color: COLOR.dim }}
          >
            Medium
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {MEDIUMS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMedium(m)}
                className="text-[10px] px-2.5 py-1"
                style={{
                  fontFamily: FONT.sans,
                  borderRadius: 999,
                  border: `1px solid ${medium === m ? COLOR.accent : COLOR.line}`,
                  color: medium === m ? COLOR.accent : COLOR.dim,
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label
            className="block text-[9.5px] mb-1.5"
            style={{ fontFamily: FONT.sans, letterSpacing: "0.14em", textTransform: "uppercase", color: COLOR.dim }}
          >
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this, what inspired it…"
            rows={3}
            className="w-full text-sm resize-none outline-none bg-transparent"
            style={{ color: COLOR.ink, lineHeight: "22px" }}
          />
        </div>

        {error && <div className="text-xs mb-3" style={{ color: COLOR.danger }}>{error}</div>}
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-sm" style={{ color: COLOR.dim }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="text-sm px-4 py-2.5"
            style={{ background: COLOR.accent, color: COLOR.surface, fontFamily: FONT.sans }}
          >
            {busy ? "Filing…" : "File this plate →"}
          </button>
        </div>
      </div>
    </div>
  );
}
