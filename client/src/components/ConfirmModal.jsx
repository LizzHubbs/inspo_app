import { COLOR, FONT } from "../theme";

// Not window.confirm() — some mobile webviews/PWA contexts suppress native
// dialogs entirely (confirm() silently returns false), which would make
// delete look broken with no error. This keeps the confirmation in-app and
// actually working everywhere the rest of the UI works.
export default function ConfirmModal({ title, message, confirmLabel = "Delete", busy, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(36,27,18,0.55)", zIndex: 50 }}>
      <div
        className="w-full max-w-sm p-5"
        style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}`, borderRadius: 2, margin: 16 }}
      >
        <div className="text-base mb-2" style={{ fontFamily: FONT.serif, fontStyle: "italic", color: COLOR.ink }}>{title}</div>
        <p className="text-sm mb-4" style={{ color: COLOR.dim }}>{message}</p>
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="text-sm" style={{ color: COLOR.dim }}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="text-sm px-4 py-2.5"
            style={{ background: COLOR.danger, color: COLOR.surface, fontFamily: FONT.sans }}
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
