import { COLOR, FONT } from "../theme";

// Wordmark on the left, profile access on the right, styled like a byline
// rather than an account icon — Feed/Search/Upload/Ideas/Goals live in
// BottomNav within thumb reach; Profile sits up here since it's visited
// far less often than the other four.
export default function TopNav({ view, setView }) {
  const active = view === "profile";
  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-between px-4"
      style={{
        borderBottom: `1px solid ${COLOR.line}`,
        background: COLOR.bg,
        paddingTop: "calc(0.75rem + env(safe-area-inset-top))",
        paddingBottom: "0.75rem",
      }}
    >
      <div className="text-lg" style={{ fontFamily: FONT.serif, color: COLOR.ink }}>
        in<span style={{ color: COLOR.accent }}>zz</span>po
      </div>
      <button
        onClick={() => setView("profile")}
        className="touch-manipulation text-[11px]"
        style={{
          fontFamily: FONT.sans,
          letterSpacing: "0.05em",
          color: active ? COLOR.ink : COLOR.dim,
          borderBottom: `1.5px solid ${active ? COLOR.accent : "transparent"}`,
          paddingBottom: 2,
        }}
        aria-label="Profile"
      >
        — You
      </button>
    </div>
  );
}
