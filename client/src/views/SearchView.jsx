import { useEffect, useState } from "react";
import IndexRow, { itemToRowProps } from "../components/IndexRow";
import { listPhotos } from "../api/photos";
import { searchUsers, addFriend, removeFriend } from "../api/users";
import { COLOR, FONT } from "../theme";

// Photo results come from the backend now (title + description match, see
// photo.repository.ts's searchPhotos) — no more client-side tag filtering
// over a fixed recent-50 list. Debounced the same way the people search
// already was, so typing doesn't fire a request per keystroke.
//
// The same query box also searches for people (usernames aren't in the
// photo results this fetches). Photo results and people results are
// unrelated to the same text, so they're just two independent sections
// under one input.
export default function SearchView({ onOpen, onOpenUser }) {
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState([]);
  const [peopleError, setPeopleError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const q = query.trim();
    const t = setTimeout(
      () => {
        listPhotos(q ? { q, limit: 50 } : { limit: 50 })
          .then((d) => !cancelled && setResults(d.photos))
          .finally(() => !cancelled && setLoading(false));
      },
      q ? 250 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setPeople([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      searchUsers(q)
        .then((d) => !cancelled && setPeople(d.users))
        .catch((e) => !cancelled && setPeopleError(e.message));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  async function handleAddFriend(id) {
    await addFriend(id);
    setPeople((p) => p.map((u) => (u.id === id ? { ...u, isFriend: true } : u)));
  }

  async function handleRemoveFriend(id) {
    await removeFriend(id);
    setPeople((p) => p.map((u) => (u.id === id ? { ...u, isFriend: false } : u)));
  }

  return (
    <div className="p-4">
      <div
        className="text-[10px] mb-3"
        style={{ fontFamily: FONT.sans, letterSpacing: "0.2em", textTransform: "uppercase", color: COLOR.accent }}
      >
        Index
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a name, a work, a vibe…"
        className="w-full pb-2 text-sm outline-none bg-transparent"
        style={{
          borderBottom: `1px solid ${COLOR.ink}`,
          color: COLOR.ink,
          fontFamily: FONT.serif,
          fontStyle: "italic",
        }}
      />

      {query.trim() && (
        <div className="mt-5">
          <div
            className="text-[9.5px] mb-1"
            style={{ fontFamily: FONT.sans, letterSpacing: "0.16em", textTransform: "uppercase", color: COLOR.dim }}
          >
            People
          </div>
          {peopleError && <div className="text-sm mb-2" style={{ color: COLOR.danger }}>{peopleError}</div>}
          {people.length === 0 ? (
            <div className="text-sm py-2" style={{ color: COLOR.dim }}>No one matches "{query.trim()}".</div>
          ) : (
            <div>
              {people.map((u) => (
                <div
                  key={u.id}
                  onClick={() => onOpenUser(u.id)}
                  className="flex items-center justify-between"
                  style={{ padding: "11px 0", borderTop: `1px solid ${COLOR.line}`, cursor: "pointer" }}
                >
                  <span className="text-sm" style={{ color: COLOR.ink, fontFamily: FONT.serif }}>{u.username}</span>
                  {u.isBlockedByMe ? (
                    <span className="text-[10px]" style={{ color: COLOR.dim, fontFamily: FONT.sans }}>Blocked</span>
                  ) : u.isFriend ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFriend(u.id);
                      }}
                      className="text-[10px]"
                      style={{ color: COLOR.dim, fontFamily: FONT.sans }}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddFriend(u.id);
                      }}
                      className="text-[10px]"
                      style={{ color: COLOR.accent, fontFamily: FONT.sans }}
                    >
                      Add friend
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        className="text-[9.5px] mt-6 mb-1"
        style={{ fontFamily: FONT.sans, letterSpacing: "0.16em", textTransform: "uppercase", color: COLOR.dim }}
      >
        Work
      </div>
      {loading ? (
        <div className="text-sm py-2" style={{ color: COLOR.dim }}>Loading…</div>
      ) : results.length === 0 ? (
        <div className="text-sm py-8 text-center" style={{ color: COLOR.dim }}>Nothing matches yet.</div>
      ) : (
        <div>
          {results.map((p) => (
            <IndexRow key={p.id} {...itemToRowProps(p)} onClick={() => onOpen(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
