import { COLOR } from "../theme";

// Curated line colors rather than a free picker — a handful tuned to stay
// legible over a photo instead of any arbitrary color a picker would allow.
export const LINE_COLORS = [
  { id: "brass", label: "Oxblood", value: COLOR.accent },
  { id: "white", label: "White", value: "#f5f2ea" },
  { id: "black", label: "Black", value: "#1a1a1a" },
  { id: "red", label: "Red", value: "#e2574c" },
  { id: "blue", label: "Blue", value: "#6fa8dc" },
];

export const GRID_SIZE_MIN = 2;
export const GRID_SIZE_MAX = 12;

// The classic grid-method aid — lay evenly spaced lines over the reference
// so proportions are easier to copy square-by-square. Pure overlay, drawn
// with a repeating background gradient rather than N absolutely-positioned
// divs. Lives inside the same zoom/pan transform as the photo, so it scales
// and shifts along with it.
export default function GridOverlay({ size, color = COLOR.accent }) {
  if (!size) return null;
  const cell = 100 / size;
  return (
    <div
      className="absolute inset-0"
      style={{
        pointerEvents: "none",
        backgroundImage: `
          repeating-linear-gradient(to right, ${color} 0, ${color} 1px, transparent 1px, transparent ${cell}%),
          repeating-linear-gradient(to bottom, ${color} 0, ${color} 1px, transparent 1px, transparent ${cell}%)
        `,
        opacity: 0.6,
      }}
    />
  );
}
