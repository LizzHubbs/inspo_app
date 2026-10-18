import { getFrameStyle } from "./frameStyles";

// The whole "vibe" of a room is one curated theme — wall, floor, frame
// look, plaque, and lighting all bundled together, plus the page chrome
// (header, name, action links, tabs) that wraps the wall — rather than
// separate wall/floor color pickers and a per-piece frame customizer.
// Picking a theme is the only room-level customization; where a piece
// sits on the wall is the only per-piece one (see MuseumWall.jsx).
//
// Keep the id list in sync with ALLOWED_ROOM_THEMES in the server's
// gallery.types.ts and the room_theme check constraint in db/schema.sql.
export const ROOM_THEMES = [
  { id: "midnight-gallery", label: "Midnight Gallery" },
  { id: "sunlit-atelier", label: "Sunlit Atelier" },
  { id: "white-cube", label: "White Cube" },
  { id: "salon-rouge", label: "Salon Rouge" },
];

const DEFS = {
  "midnight-gallery": {
    label: "Midnight Gallery",
    wallBackground: "radial-gradient(ellipse at 50% -10%, #24382c 0%, #142019 60%)",
    floorBackground: "linear-gradient(180deg, #3a2b1e 0%, #241a11 100%)",
    vignette: true,
    frameStyleId: "gilded-baroque",
    frameWidth: 130,
    spotlight: "glow",
    plaqueVariant: "metal-brass",
    chrome: {
      pageBackground: "radial-gradient(ellipse at 50% -8%, #24382c 0%, #142019 58%)",
      ink: "#ECE6D6",
      dim: "rgba(236,230,214,0.55)",
      accent: "#C9A227",
      rule: "rgba(201,162,39,0.25)",
      nameColor: "#ECE6D6",
      nameStyle: "italic",
      nameWeight: 400,
      nameTransform: "none",
      nameSerif: true,
      linkSeparator: "·",
    },
  },
  "sunlit-atelier": {
    label: "Sunlit Atelier",
    wallBackground:
      "radial-gradient(circle at 82% 3%, rgba(255,250,230,0.65) 0%, rgba(255,250,230,0) 42%), linear-gradient(180deg, #f2e7d1 0%, #e4d5b8 100%)",
    floorBackground: "repeating-linear-gradient(90deg, #b9915f 0 34px, #ad8455 34px 36px)",
    vignette: false,
    frameStyleId: "natural-oak",
    frameWidth: 130,
    spotlight: "none",
    plaqueVariant: "wood-tag",
    chrome: {
      pageBackground:
        "radial-gradient(circle at 82% 3%, rgba(255,250,230,0.65) 0%, rgba(255,250,230,0) 42%), linear-gradient(180deg, #f2e7d1 0%, #e4d5b8 100%)",
      ink: "#3c2a16",
      dim: "rgba(60,42,22,0.55)",
      accent: "#a8552f",
      rule: "rgba(60,42,22,0.18)",
      nameColor: "#3c2a16",
      nameStyle: "italic",
      nameWeight: 400,
      nameTransform: "none",
      nameSerif: true,
      linkSeparator: "·",
    },
  },
  "white-cube": {
    label: "White Cube",
    wallBackground: "linear-gradient(180deg, #fbfbf9 0%, #f2f2ee 100%)",
    floorBackground: "linear-gradient(180deg, #d9d9d3 0%, #c9c9c1 100%)",
    vignette: false,
    frameStyleId: "modern-floater",
    frameWidth: 120,
    spotlight: "track",
    plaqueVariant: "label-side",
    chrome: {
      pageBackground: "linear-gradient(180deg, #ffffff 0%, #f1f1ee 100%)",
      ink: "#111111",
      dim: "#8a8a86",
      accent: "#111111",
      rule: "rgba(17,17,17,0.14)",
      nameColor: "#111111",
      nameStyle: "normal",
      nameWeight: 700,
      nameTransform: "uppercase",
      nameSerif: false,
      linkSeparator: "",
    },
  },
  "salon-rouge": {
    label: "Salon Rouge",
    wallBackground: "radial-gradient(ellipse at 50% -8%, #7a2634 0%, #3a0f18 62%)",
    floorBackground: "repeating-linear-gradient(45deg, #2b1a10 0 10px, #241409 10px 20px)",
    vignette: true,
    frameStyleId: "brushed-brass",
    frameWidth: 100,
    spotlight: "picklight",
    plaqueVariant: "gold-foil",
    chrome: {
      pageBackground: "radial-gradient(ellipse at 50% -8%, #7a2634 0%, #3a0f18 62%)",
      ink: "#f0e0c0",
      dim: "rgba(240,224,192,0.55)",
      accent: "#d4af37",
      rule: "rgba(212,175,55,0.3)",
      nameColor: "#d4af37",
      nameStyle: "italic",
      nameWeight: 400,
      nameTransform: "none",
      nameSerif: true,
      linkSeparator: "◆",
    },
  },
};

export function getRoomTheme(id) {
  const key = DEFS[id] ? id : "midnight-gallery";
  const def = DEFS[key];
  return { id: key, ...def, frame: getFrameStyle(def.frameStyleId) };
}
