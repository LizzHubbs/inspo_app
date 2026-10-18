import { COLOR, FONT } from "../theme";

// Fixed to the bottom so Plates/Index/Submit/Prompts/Aims sit within thumb
// reach on phones — Profile lives in TopNav instead since it's visited far
// less often. Text tabs, small-caps, underlined when active — the same
// running-contents-strip a book uses, not icon glyphs. Submit is the
// literal middle tab (3rd of 5), same as the old Upload position.
export default function BottomNav({ view, setView, onUpload }) {
  const tabs = [
    { id: "feed", label: "Plates" },
    { id: "search", label: "Index" },
    { id: "submit", label: "Submit", action: onUpload },
    { id: "ideas", label: "Prompts" },
    { id: "goals", label: "Aims" },
  ];

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex items-center"
      style={{
        background: COLOR.bg,
        borderTop: `1px solid ${COLOR.line}`,
        paddingBottom: "env(safe-area-inset-bottom)",
        height: "calc(58px + env(safe-area-inset-bottom))",
      }}
    >
      {tabs.map((t) => {
        const isActive = t.id === view;
        return (
          <button
            key={t.id}
            onClick={t.action || (() => setView(t.id))}
            className="flex items-center justify-center flex-1 h-full touch-manipulation"
          >
            <span
              className="text-[11px]"
              style={{
                fontFamily: FONT.sans,
                letterSpacing: "0.04em",
                color: isActive ? COLOR.ink : COLOR.dim,
                borderBottom: `1.5px solid ${isActive ? COLOR.accent : "transparent"}`,
                paddingBottom: 4,
              }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
