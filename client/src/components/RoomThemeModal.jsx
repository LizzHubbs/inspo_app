import { useState } from "react";
import { ROOM_THEMES, getRoomTheme } from "../lib/roomThemes";
import { COLOR, FONT } from "../theme";

// A small preview of the actual room (not just a label or a color swatch)
// — the whole point of a curated theme is seeing wall, floor, and frame
// together before picking one.
function ThemePreview({ id, label, active, onClick }) {
  const theme = getRoomTheme(id);
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5" style={{ background: "none" }}>
      <div
        style={{
          width: 74,
          height: 56,
          background: theme.wallBackground,
          boxShadow: active ? `0 0 0 2px ${COLOR.accent}` : `0 0 0 1px ${COLOR.line}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, background: theme.floorBackground }} />
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 20,
            height: 24,
            border: theme.frame.border,
            borderImage: theme.frame.borderImage,
            background: theme.frame.background || theme.frame.matColor,
          }}
        />
      </div>
      <span className="text-[10px]" style={{ fontFamily: FONT.sans, color: active ? COLOR.accent : COLOR.dim }}>{label}</span>
    </button>
  );
}

// The one room-level customization left — which curated design the whole
// wall (and the page chrome around it) uses — plus how many pieces show
// on it at once. Frame style, plaque, and wall/floor color all ride along
// with the theme now; there's nothing else to pick separately.
export default function RoomThemeModal({ initialRoomTheme, initialMaxPieces, onSubmit, onClose }) {
  const [roomTheme, setRoomTheme] = useState(initialRoomTheme || ROOM_THEMES[0].id);
  const [maxPieces, setMaxPieces] = useState(initialMaxPieces ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ roomTheme, maxPieces: maxPieces === "" ? null : Number(maxPieces) });
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
        <div className="text-base mb-4" style={{ fontFamily: FONT.serif, fontStyle: "italic", color: COLOR.ink }}>Choose your room</div>

        <div className="flex gap-4 mb-5 flex-wrap justify-center">
          {ROOM_THEMES.map((t) => (
            <ThemePreview key={t.id} id={t.id} label={t.label} active={roomTheme === t.id} onClick={() => setRoomTheme(t.id)} />
          ))}
        </div>

        <div className="mb-2">
          <label className="block text-[9.5px] mb-1.5" style={{ fontFamily: FONT.sans, letterSpacing: "0.14em", textTransform: "uppercase", color: COLOR.dim }}>
            Max pieces shown
          </label>
          <input
            type="number"
            min="1"
            value={maxPieces}
            onChange={(e) => setMaxPieces(e.target.value)}
            placeholder="Show all"
            className="w-full pb-1.5 text-sm outline-none bg-transparent"
            style={{ borderBottom: `1px solid ${COLOR.ink}`, color: COLOR.ink, fontFamily: FONT.serif, fontStyle: "italic" }}
          />
        </div>
        <p className="text-[10.5px] mb-4" style={{ color: COLOR.dim }}>
          Your most recent pieces show first when there are more than this.
        </p>

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
