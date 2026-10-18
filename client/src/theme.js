// The Catalogue — warm paper, ink, a single oxblood accent, serif italic
// captions. This is the app-wide default now (nav chrome, feed, detail,
// search, ideas, upload, goals, settings, modals). Centralized because
// every view shares this exact palette; keeps the design consistent
// instead of dozens of copies of the same hex.
export const COLOR = {
  bg: "#F3ECD9",
  surface: "#FBF6EC",
  ink: "#241B12",
  dim: "#79705C",
  accent: "#8B3A2B",
  line: "rgba(36,27,18,0.16)",
  danger: "#B3261E",
};

export const FONT = {
  serif: "Georgia, 'Iowan Old Style', 'Times New Roman', serif",
  sans: "-apple-system, 'Helvetica Neue', Arial, sans-serif",
};

// The one place the old Gallery Wall palette survives — the museum room
// itself (MuseumWall.jsx) stays a dark, lit room on purpose (an
// "installation view" printed into the catalogue, not a paper page), along
// with the two modals that edit it (frame/plaque style, wall/floor color).
// Nothing else should import this.
export const MUSEUM_COLOR = {
  bg: "#142019",
  surface: "#1C2B23",
  ink: "#ECE6D6",
  dim: "#8FA093",
  brass: "#C9A227",
  line: "rgba(201,162,39,0.22)",
  danger: "#E2604A",
};
