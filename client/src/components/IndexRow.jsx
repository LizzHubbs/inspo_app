import { API_URL } from "../api/client";
import { COLOR, FONT } from "../theme";

// The Catalogue's answer to a grid tile — a compact row (thumbnail, title,
// small-caps meta, optional right-side link), the way a museum directory
// or a book's index lists entries. Used anywhere multiple works or people
// show up as a set: Search results, "Responses", Working On, People.
export default function IndexRow({ thumbnailSrc, title, meta, rightLabel, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3"
      style={{ padding: "11px 0", borderTop: `1px solid ${COLOR.line}`, cursor: onClick ? "pointer" : "default" }}
    >
      <div style={{ width: 40, height: 40, flexShrink: 0, background: COLOR.surface, overflow: "hidden" }}>
        {thumbnailSrc && <img src={thumbnailSrc} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate" style={{ fontFamily: FONT.serif, color: COLOR.ink }}>{title}</div>
        {meta && (
          <div
            className="text-[9.5px] mt-0.5 truncate"
            style={{ fontFamily: FONT.sans, letterSpacing: "0.05em", textTransform: "uppercase", color: COLOR.dim }}
          >
            {meta}
          </div>
        )}
      </div>
      {rightLabel && (
        <div className="text-[10px] flex-shrink-0" style={{ fontFamily: FONT.sans, color: COLOR.accent }}>
          {rightLabel}
        </div>
      )}
    </div>
  );
}

// A thin convenience for building a row straight from a photo/art item —
// most call sites just have one of those, not raw thumbnail/title/meta.
export function itemToRowProps(item) {
  const medium = item?.kind === "art" ? item?.medium : "Photograph";
  return {
    thumbnailSrc: item?.storageKey ? `${API_URL}/uploads/${item.storageKey}` : null,
    title: item?.title || "Untitled",
    meta: [medium, item?.ownerUsername ? `— ${item.ownerUsername}` : null].filter(Boolean).join(" "),
  };
}
