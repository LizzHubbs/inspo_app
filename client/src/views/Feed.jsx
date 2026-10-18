import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Plate from "../components/Plate";
import { getFeed } from "../api/feed";
import { lovePhoto, unlovePhoto } from "../api/photos";
import { loveArt, unloveArt } from "../api/art";
import { COLOR, FONT } from "../theme";

// One plate at a time, not a grid — this is friends' latest work, ranked by
// what you've already loved (see feed.repository.ts), meant to be looked
// at one piece at a time rather than scanned. refreshKey is bumped by
// App.jsx after a successful upload so a friend's brand-new post can
// appear without a full reload (it won't outrank a strong affinity match,
// but it'll be there).
export default function Feed({ onOpenPhoto, onOpenArt, refreshKey }) {
  const [items, setItems] = useState([]);
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setI(0);
    getFeed()
      .then((d) => setItems(d.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  async function handleToggleLove(item) {
    const updated =
      item.kind === "art"
        ? item.lovedByMe
          ? await unloveArt(item.id)
          : await loveArt(item.id)
        : item.lovedByMe
        ? await unlovePhoto(item.id)
        : await lovePhoto(item.id);
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...updated, kind: item.kind } : it)));
  }

  if (loading) return <div className="text-sm p-4" style={{ color: COLOR.dim }}>Loading plates…</div>;
  if (error) return <div className="text-sm p-4" style={{ color: COLOR.danger }}>{error}</div>;
  if (items.length === 0) {
    return (
      <div className="text-sm p-8 text-center" style={{ color: COLOR.dim }}>
        Nothing here yet — add friends in the Index and admire a few works, and their latest will show up here.
      </div>
    );
  }

  const item = items[i];

  return (
    <div className="p-4 flex flex-col items-center">
      <div className="text-center mb-4">
        <div className="text-[10px]" style={{ fontFamily: FONT.sans, letterSpacing: "0.2em", textTransform: "uppercase", color: COLOR.accent }}>
          Recent plates
        </div>
        <div className="text-xs mt-1" style={{ color: COLOR.dim }}>{i + 1} of {items.length}</div>
      </div>

      <div className="w-full max-w-sm">
        <Plate
          item={item}
          onClick={() => (item.kind === "art" ? onOpenArt(item.id) : onOpenPhoto(item.id))}
          onToggleLove={handleToggleLove}
        />
      </div>

      <div className="flex items-center gap-4 mt-5">
        <button
          onClick={() => setI((n) => Math.max(0, n - 1))}
          disabled={i === 0}
          className="flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: 999, border: `1px solid ${COLOR.line}`, background: COLOR.surface, opacity: i === 0 ? 0.4 : 1 }}
        >
          <ChevronLeft size={16} style={{ color: COLOR.dim }} />
        </button>
        <button
          onClick={() => setI((n) => Math.min(items.length - 1, n + 1))}
          disabled={i === items.length - 1}
          className="flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: 999, border: `1px solid ${COLOR.line}`, background: COLOR.surface, opacity: i === items.length - 1 ? 0.4 : 1 }}
        >
          <ChevronRight size={16} style={{ color: COLOR.dim }} />
        </button>
      </div>
    </div>
  );
}
