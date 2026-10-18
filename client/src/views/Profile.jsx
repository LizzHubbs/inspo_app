import { useEffect, useState } from "react";
import FriendsPanel from "../components/FriendsPanel";
import MuseumWall from "../components/MuseumWall";
import RoomThemeModal from "../components/RoomThemeModal";
import IndexRow from "../components/IndexRow";
import { listPhotos, listWorkingPhotos, stopWorkingOn, updatePhotoPosition } from "../api/photos";
import { listArtForUser, updateArtPosition } from "../api/art";
import { getGallerySettings, updateGallerySettings } from "../api/gallery";
import { getRoomTheme } from "../lib/roomThemes";
import { deleteOfflinePhoto } from "../lib/offlinePhotoStore";
import { API_URL, USER_ID } from "../api/client";
import { COLOR, FONT } from "../theme";

// Your Room is a museum room, not a grid — a photo and a painting hang on
// the same wall in a real gallery, so they show up together here, walked
// past left to right (see MuseumWall.jsx) instead of scrolled through as
// tiles. The whole page — header, name, action links, tabs, not just the
// wall — takes on the owner's chosen room theme (see lib/roomThemes.js),
// so it reads as one coordinated room rather than a themed wall sitting in
// generic chrome. Picking a theme and where each piece sits are the only
// two customizations left; "Arrange" gates dragging so browsing the wall
// (scroll) and rearranging it never fight over the same touch gesture.
export default function Profile({ onOpen, onOpenArt, onOpenUser, onOpenSettings, onOpenWorking }) {
  const [tab, setTab] = useState("room");
  const [gallery, setGallery] = useState([]);
  const [working, setWorking] = useState([]);
  const [settings, setSettings] = useState({ roomTheme: "midnight-gallery", maxPieces: null });
  const [loading, setLoading] = useState(true);
  const [arranging, setArranging] = useState(false);
  const [showTheme, setShowTheme] = useState(false);

  function loadGallery() {
    return Promise.all([listPhotos({ limit: 50 }), listArtForUser(USER_ID)]).then(([photos, art]) => {
      const merged = [
        ...photos.photos.filter((p) => p.ownerId === USER_ID).map((p) => ({ ...p, kind: "photo" })),
        ...art.art.map((a) => ({ ...a, kind: "art" })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setGallery(merged);
    });
  }

  useEffect(() => {
    Promise.all([loadGallery(), listWorkingPhotos(), getGallerySettings(USER_ID)])
      .then(([, workingPhotos, gallerySettings]) => {
        setWorking(workingPhotos.photos);
        setSettings(gallerySettings);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleRemoveWorking(e, photoId) {
    e.stopPropagation();
    await stopWorkingOn(photoId);
    await deleteOfflinePhoto(photoId);
    setWorking((w) => w.filter((p) => p.id !== photoId));
  }

  function applyUpdate(kind, id, updated) {
    setGallery((g) => g.map((it) => (it.kind === kind && it.id === id ? { ...updated, kind } : it)));
  }

  async function handlePlacementChange(item, { x, y }) {
    const updated =
      item.kind === "art" ? await updateArtPosition(item.id, { wallX: x, wallY: y }) : await updatePhotoPosition(item.id, { wallX: x, wallY: y });
    applyUpdate(item.kind, item.id, updated);
  }

  async function handleSaveTheme(newSettings) {
    const updated = await updateGallerySettings(newSettings);
    setSettings(updated);
  }

  const theme = getRoomTheme(settings.roomTheme);
  const chrome = theme.chrome;
  const shownGallery = settings.maxPieces ? gallery.slice(0, settings.maxPieces) : gallery;

  const links = [
    ...(tab === "room" ? [{ label: arranging ? "Done" : "Arrange", onClick: () => setArranging((a) => !a) }] : []),
    { label: "Room design", onClick: () => setShowTheme(true) },
    { label: "Settings", onClick: onOpenSettings },
  ];

  return (
    <div className="p-4" style={{ background: chrome.pageBackground, margin: "0 -1rem", padding: "1rem" }}>
      <div className="text-[10px] mb-1" style={{ fontFamily: FONT.sans, letterSpacing: "0.2em", textTransform: "uppercase", color: chrome.accent }}>
        Your room
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
            letterSpacing: chrome.nameTransform === "uppercase" ? "0.02em" : "normal",
          }}
        >
          You
        </div>
        <div className="flex items-center gap-2">
          {links.map((l, i) => (
            <span key={l.label} className="flex items-center gap-2">
              {i > 0 && chrome.linkSeparator && <span style={{ color: chrome.accent, opacity: 0.5, fontSize: 8 }}>{chrome.linkSeparator}</span>}
              <button onClick={l.onClick} className="text-xs" style={{ fontFamily: FONT.sans, color: chrome.accent, textTransform: chrome.nameTransform === "uppercase" ? "uppercase" : "none", letterSpacing: chrome.nameTransform === "uppercase" ? "0.05em" : "normal" }}>
                {l.label}
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className="text-xs mb-4" style={{ color: chrome.dim }}>{gallery.length} {gallery.length === 1 ? "piece" : "pieces"}</div>

      <div className="flex gap-5 mb-5" style={{ borderBottom: `1px solid ${chrome.rule}` }}>
        {[
          { id: "room", label: "Room" },
          { id: "working", label: "Working proofs" },
          { id: "friends", label: "Correspondents" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="text-[11px] pb-2.5"
            style={{
              fontFamily: FONT.sans,
              letterSpacing: "0.03em",
              textTransform: chrome.nameTransform === "uppercase" ? "uppercase" : "none",
              color: tab === t.id ? chrome.nameColor : chrome.dim,
              borderBottom: tab === t.id ? `1.5px solid ${chrome.accent}` : "1.5px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "friends" ? (
        <FriendsPanel onOpenUser={onOpenUser} />
      ) : loading ? (
        <div className="text-sm" style={{ color: chrome.dim }}>Loading…</div>
      ) : tab === "working" ? (
        working.length === 0 ? (
          <div className="text-sm py-8 text-center" style={{ color: chrome.dim }}>
            Nothing in progress — tap "Work from this" on a photo to start working from it offline.
          </div>
        ) : (
          <div>
            {working.map((p) => (
              <IndexRow
                key={p.id}
                thumbnailSrc={p.storageKey ? `${API_URL}/uploads/${p.storageKey}` : null}
                title={p.title || "Untitled"}
                meta="Photograph"
                rightLabel={
                  <span onClick={(e) => handleRemoveWorking(e, p.id)} style={{ color: COLOR.danger }}>Remove</span>
                }
                onClick={() => onOpenWorking(p.id)}
              />
            ))}
          </div>
        )
      ) : (
        <>
          {arranging && (
            <p className="text-xs mb-3" style={{ color: chrome.dim }}>
              Drag a piece to move it. Pieces can't overlap — dragging one onto another snaps it back.
            </p>
          )}
          <MuseumWall
            items={shownGallery}
            theme={theme}
            arranging={arranging}
            onOpenPiece={(item) => (item.kind === "art" ? onOpenArt(item.id) : onOpen(item.id))}
            onPlacementChange={handlePlacementChange}
          />
          {settings.maxPieces && gallery.length > settings.maxPieces && (
            <div className="text-[10px] text-center mt-2" style={{ fontFamily: FONT.sans, color: chrome.dim }}>
              Showing your {settings.maxPieces} most recent of {gallery.length}
            </div>
          )}
          <div
            className="text-[10px] text-center mt-2"
            style={
              chrome.nameSerif
                ? { fontFamily: FONT.sans, fontStyle: "italic", color: chrome.dim }
                : { fontFamily: FONT.sans, textTransform: "uppercase", letterSpacing: "0.08em", color: chrome.dim }
            }
          >
            Installation view — Your Room, {new Date().getFullYear()}
          </div>
        </>
      )}

      {showTheme && (
        <RoomThemeModal
          initialRoomTheme={settings.roomTheme}
          initialMaxPieces={settings.maxPieces}
          onSubmit={handleSaveTheme}
          onClose={() => setShowTheme(false)}
        />
      )}
    </div>
  );
}
