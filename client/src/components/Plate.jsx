import { API_URL } from "../api/client";
import { COLOR, FONT } from "../theme";

// The Catalogue's answer to a big detail image — full width, aspect-locked
// (not cropped to a square), a plate number, an italic title, a small-caps
// byline, and a quiet "N admirers" line that doubles as the love toggle.
// Used anywhere a single work gets the large treatment: Feed, Photo/Art
// Detail, Onboarding.
export default function Plate({ item, plateNumber, onClick, onToggleLove, aspectRatio = "4 / 5" }) {
  const src = item?.storageKey ? `${API_URL}/uploads/${item.storageKey}` : null;
  const medium = item?.kind === "art" ? item?.medium : "Photograph";
  const byline = [medium, item?.ownerUsername ? `— ${item.ownerUsername}` : null].filter(Boolean).join(" ");
  const loved = !!item?.lovedByMe;
  const loveCount = item?.loveCount || 0;

  return (
    <div className="w-full">
      {plateNumber != null && (
        <div
          className="text-[10px] mb-2"
          style={{ fontFamily: FONT.sans, letterSpacing: "0.12em", textTransform: "uppercase", color: COLOR.dim }}
        >
          Plate {plateNumber}
        </div>
      )}
      <div
        onClick={onClick}
        style={{ width: "100%", aspectRatio, background: COLOR.surface, cursor: onClick ? "pointer" : "default" }}
        className="relative overflow-hidden"
      >
        {src && <img src={src} alt={item?.title || ""} className="absolute inset-0 w-full h-full object-cover" />}
      </div>
      <div style={{ paddingTop: 11, borderTop: `1px solid ${COLOR.line}`, marginTop: 11 }}>
        <div className="text-base" style={{ fontFamily: FONT.serif, fontStyle: "italic", color: COLOR.ink }}>
          {item?.title || "Untitled"}
        </div>
        {byline && (
          <div
            className="text-[10px] mt-1"
            style={{ fontFamily: FONT.sans, letterSpacing: "0.05em", textTransform: "uppercase", color: COLOR.dim }}
          >
            {byline}
          </div>
        )}
        {item?.description && (
          <div className="text-xs mt-2" style={{ color: COLOR.dim, lineHeight: 1.5 }}>
            {item.description}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLove?.(item);
          }}
          className="text-[10.5px] mt-2"
          style={{ fontFamily: FONT.sans, color: loved ? COLOR.accent : COLOR.dim, cursor: onToggleLove ? "pointer" : "default" }}
        >
          {loved ? "◆" : "◇"} {loveCount} {loveCount === 1 ? "admirer" : "admirers"}
        </button>
      </div>
    </div>
  );
}
