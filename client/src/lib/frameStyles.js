// Six real frame archetypes, built from CSS rather than downloaded photos
// (a photographed frame can't be recolored, resized, or reliably licensed
// for reuse the way a CSS treatment can). Each is modeled on an actual
// style sold by real frame shops, named accordingly.
//
// getFrameStyle(id) returns the CSS for the frame border itself, applied
// to the element wrapping the image. `mat` (if present) is an inner
// padding ring between the frame and the image, matching real matted
// gallery frames. `corners` (if true) tells WallPiece to render small
// ornamental corner accents — only the ornate styles have these.
const STYLES = {
  "gallery-white": {
    border: "10px solid #f4f1ea",
    inset: "0 0 0 1px rgba(0,0,0,0.18)",
    mat: "10px",
    matColor: "#f4f1ea",
    corners: false,
  },
  "modern-floater": {
    border: "7px solid #1a1a1a",
    inset: "0 0 0 1px rgba(255,255,255,0.06)",
    mat: "8px",
    matColor: "#2a2a2a",
    corners: false,
  },
  "gilded-baroque": {
    border: "16px solid transparent",
    borderImage: "linear-gradient(135deg, #7a5a1e, #e9c869, #a9791f, #f3d98a, #7a5a1e) 1",
    inset: "0 0 0 2px rgba(0,0,0,0.35)",
    mat: "6px",
    matColor: "#241c10",
    corners: true,
    cornerColor: "#e9c869",
  },
  "natural-oak": {
    border: "12px solid #8a6438",
    background: "repeating-linear-gradient(100deg, #8a6438 0px, #9c7548 6px, #7d5a30 12px, #8a6438 18px)",
    inset: "0 0 0 1px rgba(0,0,0,0.25)",
    mat: "8px",
    matColor: "#f0e9dc",
    corners: false,
  },
  "brushed-brass": {
    border: "9px solid #b08d4f",
    background: "repeating-linear-gradient(115deg, #a17c3f 0px, #c9a768 4px, #96723a 8px, #d4b479 12px)",
    inset: "0 0 0 1px rgba(0,0,0,0.3)",
    mat: "6px",
    matColor: "#1c1a16",
    corners: false,
  },
  "rococo-silver": {
    border: "14px solid transparent",
    borderImage: "linear-gradient(135deg, #8b9399, #e4e9ec, #9aa2a8, #f2f5f6, #8b9399) 1",
    inset: "0 0 0 2px rgba(0,0,0,0.3)",
    mat: "6px",
    matColor: "#20232a",
    corners: true,
    cornerColor: "#e4e9ec",
  },
};

export function getFrameStyle(id) {
  return STYLES[id] || STYLES["gallery-white"];
}
