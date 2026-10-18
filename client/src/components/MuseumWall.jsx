import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../api/client";
import { FONT } from "../theme";

const BAND_HEIGHT = 340;
const FLOOR_HEIGHT = 100;
const GAP = 40;
const START_PAD = 40;
const END_PAD = 60;
const MIN_WALL_WIDTH = 700;
// Minimum breathing room enforced between any two pieces — bigger than GAP
// isn't required (auto-placed pieces are always at least GAP apart
// already), this is what keeps a *dragged* piece from ever landing flush
// against, or on top of, its neighbors.
const MIN_SPACING = 14;

// Anything without an explicit wallX/wallY (never dragged, or just
// uploaded) gets auto-placed in sequence rather than stacking at (0,0) —
// the auto cursor only advances for auto-placed pieces, so dragging one
// piece never disturbs where its un-dragged neighbors land. Every piece is
// the same size now (the room theme's frame width) — size stopped being a
// per-piece choice along with frame style and room color.
function layoutWall(items, width, height) {
  let autoCursor = START_PAD;
  const placed = items.map((item, i) => {
    let x = item.wallX;
    let y = item.wallY;
    if (x == null) {
      x = autoCursor;
      autoCursor += width + GAP;
    }
    if (y == null) {
      const variance = i % 2 === 0 ? -16 : 16;
      y = Math.round((BAND_HEIGHT - height) / 2) + variance;
    }
    y = Math.max(10, Math.min(y, Math.max(10, BAND_HEIGHT - height - 10)));
    return { ...item, x, y };
  });
  const rightEdge = placed.reduce((m, p) => Math.max(m, p.x + width), 0);
  const wallWidth = Math.max(rightEdge + END_PAD, MIN_WALL_WIDTH);
  return { placed, wallWidth };
}

// Inflate-and-test AABB overlap — inflating by MIN_SPACING (rather than
// testing exact edges) is what turns "don't overlap" into "leave a gap",
// so frames never end up touching edge-to-edge either.
function collidesAny(box, others, size, padding = MIN_SPACING) {
  return others.some(
    (o) =>
      box.x + size.width + padding > o.x &&
      o.x + size.width + padding > box.x &&
      box.y + size.height + padding > o.y &&
      o.y + size.height + padding > box.y
  );
}

// Four plaque treatments, one per room theme — a brass plate, a painted
// wood tag, a museum didactic label mounted beside the frame instead of
// under it, or a gold-foil tag. Only "label-side" changes position; the
// other three all sit centered below the frame.
function Plaque({ item, variant, width, height }) {
  const label = item.kind === "art" ? item.medium : "Photograph";
  const showLabel = !!label;

  if (variant === "label-side") {
    return (
      <div style={{ position: "absolute", top: 0, left: "100%", marginLeft: 10, width: 84, pointerEvents: "none" }}>
        <div className="text-[9px]" style={{ fontFamily: FONT.sans, letterSpacing: "0.08em", textTransform: "uppercase", color: "#111" }}>
          {item.title || "Untitled"}
        </div>
        {showLabel && (
          <div className="text-[8px] mt-0.5" style={{ fontFamily: FONT.sans, letterSpacing: "0.05em", textTransform: "uppercase", color: "#8a8a86" }}>
            {label}
          </div>
        )}
      </div>
    );
  }

  const boxStyle =
    variant === "wood-tag"
      ? { background: "#fbf6ec", border: "1px solid rgba(60,40,20,0.25)", padding: "3px 9px" }
      : variant === "gold-foil"
      ? {
          background: "linear-gradient(180deg,#e8c876,#b8892e)",
          border: "1px solid rgba(0,0,0,0.3)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
          padding: "3px 10px",
        }
      : {
          background: "linear-gradient(180deg, #d8c088 0%, #b3925c 55%, #9c7c4c 100%)",
          border: "1px solid rgba(0,0,0,0.4)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.3)",
          padding: "5px 11px",
        };
  const titleColor = variant === "wood-tag" ? "#3c2814" : "#241d10";
  const titleStyle = variant === "gold-foil" ? { fontStyle: "italic" } : {};

  return (
    <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: 10, width: Math.max(width, 84), pointerEvents: "none" }}>
      <div style={{ ...boxStyle, borderRadius: 2, textAlign: "center" }}>
        <div
          className="text-[10px]"
          style={{ ...titleStyle, color: titleColor, fontFamily: FONT.serif, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {item.title || "Untitled"}
        </div>
        {showLabel && (
          <div className="text-[8px]" style={{ color: variant === "wood-tag" ? "rgba(60,40,20,0.7)" : "rgba(36,29,16,0.75)", letterSpacing: "0.07em", textTransform: "uppercase", marginTop: 1 }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

// A single hung piece — image, the room theme's frame CSS, its lighting
// treatment, and its plaque. In arrange mode (owner only) it can be
// dragged to a new spot; that's the only per-piece customization left —
// frame look and size come entirely from the theme. touchAction flips
// between "auto" (let the wall scroll under a normal touch) and "none"
// (arrange mode: this piece's own pointer handlers take over instead of
// the browser's scroll gesture) — that's what lets browsing and
// rearranging share the same wall without fighting each other.
function WallPiece({ item, others, size, theme, arranging, onOpen, onDragEnd }) {
  const [pos, setPos] = useState({ x: item.x, y: item.y });
  const [invalid, setInvalid] = useState(false);
  const dragState = useRef(null);
  const movedRef = useRef(false);

  useEffect(() => setPos({ x: item.x, y: item.y }), [item.x, item.y]);

  const { width, height } = size;
  const style = theme.frame;
  const src = item.storageKey ? `${API_URL}/uploads/${item.storageKey}` : null;

  function handlePointerDown(e) {
    if (!arranging) return;
    e.stopPropagation();
    // State is set before the capture call, not after — capture can throw
    // (e.g. a pointer id the browser doesn't consider active), and when it
    // does, the state assignment must still have happened or move/up have
    // nothing to work from and the whole gesture silently no-ops.
    movedRef.current = false;
    dragState.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore — move/up still work via normal bubbling without capture;
      // capture just also keeps them firing if the pointer leaves this
      // element's bounds mid-drag.
    }
  }
  // Both move and up derive the position from the pointer event's own
  // coordinates + dragState's origin, rather than reading the `pos` state
  // set by the last move — state set that late in the same pointer gesture
  // isn't guaranteed to have committed yet when up fires right behind it,
  // which was silently dropping the final few pixels of a drag.
  function clampedPos(e) {
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const nextY = Math.max(0, Math.min(dragState.current.originY + dy, BAND_HEIGHT - height));
    return { x: Math.max(0, dragState.current.originX + dx), y: nextY };
  }
  function handlePointerMove(e) {
    if (!dragState.current) return;
    const next = clampedPos(e);
    if (Math.abs(next.x - dragState.current.originX) > 3 || Math.abs(next.y - dragState.current.originY) > 3) movedRef.current = true;
    setPos(next);
    setInvalid(collidesAny(next, others, size));
  }
  function handlePointerUp(e) {
    if (!dragState.current) return;
    const next = clampedPos(e);
    dragState.current = null;
    setInvalid(false);
    if (!movedRef.current) return; // a tap, not a drag — nothing to do
    if (collidesAny(next, others, size)) {
      // Dropped on top of another piece — snap back rather than overlap.
      setPos({ x: item.x, y: item.y });
    } else {
      onDragEnd(next);
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width,
        height,
        touchAction: arranging ? "none" : "auto",
        cursor: arranging ? "grab" : "pointer",
        outline: arranging ? `2px dashed ${invalid ? "#E2604A" : "rgba(255,255,255,0.35)"}` : "none",
        outlineOffset: 6,
        borderRadius: 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={() => !arranging && onOpen(item)}
    >
      {theme.spotlight === "glow" && (
        <div
          style={{
            position: "absolute",
            top: -Math.round(height * 0.32),
            left: "50%",
            transform: "translateX(-50%)",
            width: width * 1.6,
            height: height * 0.85,
            background: "radial-gradient(ellipse at center, rgba(255,244,214,0.32) 0%, rgba(255,244,214,0) 70%)",
            pointerEvents: "none",
          }}
        />
      )}
      {theme.spotlight === "picklight" && (
        <div
          style={{
            position: "absolute",
            top: -14,
            left: "50%",
            transform: "translateX(-50%)",
            width: Math.round(width * 0.55),
            height: 6,
            borderRadius: 3,
            background: "linear-gradient(90deg,#c9a227,#8a6a1f)",
          }}
        />
      )}
      <div style={{ width: "100%", height: "100%", border: style.border, borderImage: style.borderImage, background: style.background || style.matColor, boxShadow: "0 10px 18px rgba(0,0,0,0.35)" }}>
        <div style={{ width: "100%", height: "100%", padding: style.mat, background: style.matColor, boxSizing: "border-box" }}>
          <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative", background: "#1c2b23", boxShadow: `inset ${style.inset}` }}>
            {src && <img src={src} alt={item.title || ""} className="absolute inset-0 w-full h-full object-cover" draggable={false} />}
          </div>
        </div>
      </div>
      {style.corners && (
        <>
          <div style={{ position: "absolute", top: -3, left: -3, width: 8, height: 8, borderRadius: 999, background: style.cornerColor }} />
          <div style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 999, background: style.cornerColor }} />
          <div style={{ position: "absolute", bottom: -3, left: -3, width: 8, height: 8, borderRadius: 999, background: style.cornerColor }} />
          <div style={{ position: "absolute", bottom: -3, right: -3, width: 8, height: 8, borderRadius: 999, background: style.cornerColor }} />
        </>
      )}
      <Plaque item={item} variant={theme.plaqueVariant} width={width} height={height} />
    </div>
  );
}

// The profile "museum room" — a wall you scroll through left to right like
// walking past a real hang, instead of a grid you scroll down. Its whole
// look (wall, floor, frame, plaque, lighting) comes from the owner's
// chosen room theme; arranging gates the one remaining per-piece control,
// dragging to reposition (see WallPiece) — only ever true for the owner,
// on their own Room tab. A plain visitor (arranging always false) only
// ever taps a piece to open it.
export default function MuseumWall({ items, theme, arranging, onOpenPiece, onPlacementChange }) {
  const width = theme.frameWidth;
  const height = Math.round(width * 1.2);
  const size = { width, height };
  const { placed, wallWidth } = useMemo(() => layoutWall(items, width, height), [items, width, height]);

  if (items.length === 0) {
    return (
      <div className="text-sm py-16 text-center" style={{ color: theme.chrome.dim, border: `1px dashed ${theme.chrome.rule}`, borderRadius: 4 }}>
        Nothing on the wall yet — upload a photo or piece of art to hang the first one.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", margin: "0 -1rem" }}>
      <div style={{ position: "relative", width: wallWidth, minWidth: "100%", height: BAND_HEIGHT + FLOOR_HEIGHT }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: BAND_HEIGHT, background: theme.wallBackground }}>
          {theme.vignette && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 78%, rgba(0,0,0,0.22) 100%)" }} />}
          {theme.spotlight === "track" && (
            <div style={{ position: "absolute", top: 10, left: 20, right: 20, height: 3, background: "rgba(20,20,20,0.15)" }} />
          )}
        </div>
        <div style={{ position: "absolute", top: BAND_HEIGHT, left: 0, right: 0, height: FLOOR_HEIGHT, background: theme.floorBackground }}>
          {theme.vignette && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 30%)" }} />}
        </div>
        <div style={{ position: "absolute", top: BAND_HEIGHT - 2, left: 0, right: 0, height: 4, background: "rgba(0,0,0,0.35)" }} />

        {placed.map((item) => (
          <WallPiece
            key={`${item.kind}-${item.id}`}
            item={item}
            others={placed.filter((p) => p !== item)}
            size={size}
            theme={theme}
            arranging={arranging}
            onOpen={onOpenPiece}
            onDragEnd={(pos) => onPlacementChange(item, pos)}
          />
        ))}
      </div>
    </div>
  );
}
