import { useEffect, useState } from "react";
import { listFriends, removeFriend, blockUser } from "../api/users";
import { USER_ID } from "../api/client";
import { COLOR, FONT } from "../theme";

// Your Room's "Correspondents" tab — just your friends. Finding new people
// to add lives in the Index now (alongside work search), and your blocked
// list lives in Settings — this tab only ever shows correspondents.
export default function FriendsPanel({ onOpenUser }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    return listFriends(USER_ID).then((d) => setFriends(d.friends));
  }

  useEffect(() => {
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(id) {
    await removeFriend(id);
    await load();
  }

  async function handleBlock(id) {
    await blockUser(id);
    await load();
  }

  if (loading) return <div className="text-sm" style={{ color: COLOR.dim }}>Loading…</div>;
  if (error) return <div className="text-sm" style={{ color: COLOR.danger }}>{error}</div>;

  if (friends.length === 0) {
    return (
      <div className="text-sm py-6 text-center" style={{ color: COLOR.dim, border: `1px dashed ${COLOR.line}`, borderRadius: 3 }}>
        No correspondents yet — find people in the Index.
      </div>
    );
  }

  return (
    <div>
      {friends.map((f, i) => (
        <div
          key={f.id}
          onClick={() => onOpenUser(f.id)}
          className="flex items-center justify-between"
          style={{ padding: "11px 0", borderTop: i === 0 ? "none" : `1px solid ${COLOR.line}`, cursor: "pointer" }}
        >
          <span className="text-sm" style={{ color: COLOR.ink, fontFamily: FONT.serif }}>{f.username}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(f.id);
              }}
              className="text-[10px]"
              style={{ fontFamily: FONT.sans, color: COLOR.dim }}
            >
              Remove
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBlock(f.id);
              }}
              className="text-[10px]"
              style={{ fontFamily: FONT.sans, color: COLOR.danger }}
            >
              Block
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
