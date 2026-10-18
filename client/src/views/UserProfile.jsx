import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import MuseumWall from "../components/MuseumWall";
import { getUser, addFriend, removeFriend, blockUser, unblockUser } from "../api/users";
import { listPhotosForUser } from "../api/photos";
import { listArtForUser } from "../api/art";
import { getGallerySettings } from "../api/gallery";
import { getRoomTheme } from "../lib/roomThemes";
import { COLOR, FONT } from "../theme";

// Someone else's room — reached from a correspondent in your list, or from
// a person you found in the Index. Same museum wall as your own room
// (read-only — no arrange mode), rendered in whichever room theme they
// picked, header and all, plus the correspond/block action.
export default function UserProfile({ userId, onBack, onOpenPhoto, onOpenArt }) {
  const [user, setUser] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [settings, setSettings] = useState({ roomTheme: "midnight-gallery", maxPieces: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    return Promise.all([
      getUser(userId),
      listPhotosForUser(userId),
      listArtForUser(userId),
      getGallerySettings(userId),
    ]).then(([u, p, a, gallerySettings]) => {
      setUser(u);
      const merged = [
        ...p.photos.map((photo) => ({ ...photo, kind: "photo" })),
        ...a.art.map((art) => ({ ...art, kind: "art" })),
      ].sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
      setGallery(merged);
      setSettings(gallerySettings);
    });
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleAdd() {
    await addFriend(userId);
    setUser((u) => ({ ...u, isFriend: true }));
  }
  async function handleRemove() {
    await removeFriend(userId);
    setUser((u) => ({ ...u, isFriend: false }));
  }
  async function handleBlock() {
    await blockUser(userId);
    setUser((u) => ({ ...u, isFriend: false, isBlockedByMe: true }));
    setGallery([]);
  }
  async function handleUnblock() {
    await unblockUser(userId);
    setUser((u) => ({ ...u, isBlockedByMe: false }));
    load().catch((e) => setError(e.message));
  }

  if (error) return <div className="text-sm p-4" style={{ color: COLOR.danger }}>{error}</div>;
  if (loading || !user) return <div className="text-sm p-4" style={{ color: COLOR.dim }}>Loading…</div>;

  const theme = getRoomTheme(settings.roomTheme);
  const chrome = theme.chrome;
  const shownGallery = settings.maxPieces ? gallery.slice(0, settings.maxPieces) : gallery;

  return (
    <div className="p-4" style={{ background: chrome.pageBackground, margin: "0 -1rem", padding: "1rem", minHeight: "100%" }}>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: chrome.dim }}>
        <ArrowLeft size={15} /> Back
      </button>

      <div className="text-[10px] mb-1" style={{ fontFamily: FONT.sans, letterSpacing: "0.2em", textTransform: "uppercase", color: chrome.accent }}>
        Their room
      </div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div
          style={{
            fontFamily: chrome.nameSerif ? FONT.serif : FONT.sans,
            fontStyle: chrome.nameStyle,
            fontWeight: chrome.nameWeight,
            textTransform: chrome.nameTransform,
            color: chrome.nameColor,
            fontSize: chrome.nameSerif ? 20 : 22,
          }}
        >
          {user.username}
        </div>
        {user.isBlockedByMe ? (
          <button onClick={handleUnblock} className="text-xs" style={{ fontFamily: FONT.sans, color: chrome.dim }}>
            Unblock
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {user.isFriend ? (
              <button onClick={handleRemove} className="text-xs" style={{ fontFamily: FONT.sans, color: chrome.dim }}>Remove</button>
            ) : (
              <button onClick={handleAdd} className="text-xs" style={{ fontFamily: FONT.sans, color: chrome.accent }}>Correspond</button>
            )}
            <button onClick={handleBlock} className="text-xs" style={{ fontFamily: FONT.sans, color: COLOR.danger }}>Block</button>
          </div>
        )}
      </div>
      <div className="text-xs mb-5" style={{ color: chrome.dim }}>{gallery.length} {gallery.length === 1 ? "piece" : "pieces"}</div>

      {user.isBlockedByMe ? (
        <div className="text-sm py-8 text-center" style={{ color: chrome.dim, border: `1px dashed ${chrome.rule}`, borderRadius: 3 }}>
          You've blocked this person — unblock to see their room.
        </div>
      ) : (
        <>
          <MuseumWall
            items={shownGallery}
            theme={theme}
            arranging={false}
            onOpenPiece={(item) => (item.kind === "art" ? onOpenArt(item.id) : onOpenPhoto(item.id))}
          />
          <div
            className="text-[10px] text-center mt-2"
            style={
              chrome.nameSerif
                ? { fontFamily: FONT.sans, fontStyle: "italic", color: chrome.dim }
                : { fontFamily: FONT.sans, textTransform: "uppercase", letterSpacing: "0.08em", color: chrome.dim }
            }
          >
            Installation view — {user.username}'s Room
          </div>
        </>
      )}
    </div>
  );
}
