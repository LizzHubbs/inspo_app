import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { listBlocked, unblockUser } from "../api/users";
import { COLOR, FONT } from "../theme";

// Reached via the "Settings" link on Your Room. Just the blocked-users
// list for now — the one thing explicitly asked for; not inventing other
// settings that weren't requested.
export default function SettingsView({ onBack }) {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    return listBlocked().then((d) => setBlocked(d.blocked));
  }

  useEffect(() => {
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleUnblock(id) {
    await unblockUser(id);
    await load();
  }

  return (
    <div className="p-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: COLOR.dim }}>
        <ArrowLeft size={15} /> Back
      </button>

      <div className="text-lg mb-5" style={{ fontFamily: FONT.serif, fontStyle: "italic", color: COLOR.ink }}>Settings</div>

      <div
        className="text-[9.5px] mb-1"
        style={{ fontFamily: FONT.sans, letterSpacing: "0.16em", textTransform: "uppercase", color: COLOR.dim }}
      >
        Blocked
      </div>

      {error && <div className="text-sm mb-3" style={{ color: COLOR.danger }}>{error}</div>}

      {loading ? (
        <div className="text-sm" style={{ color: COLOR.dim }}>Loading…</div>
      ) : blocked.length === 0 ? (
        <div className="text-sm py-6 text-center" style={{ color: COLOR.dim, border: `1px dashed ${COLOR.line}` }}>
          You haven't blocked anyone.
        </div>
      ) : (
        <div>
          {blocked.map((b, i) => (
            <div
              key={b.id}
              className="flex items-center justify-between"
              style={{ padding: "11px 0", borderTop: i === 0 ? "none" : `1px solid ${COLOR.line}` }}
            >
              <span className="text-sm" style={{ color: COLOR.ink, fontFamily: FONT.serif }}>{b.username}</span>
              <button onClick={() => handleUnblock(b.id)} className="text-[10px]" style={{ fontFamily: FONT.sans, color: COLOR.dim }}>
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
