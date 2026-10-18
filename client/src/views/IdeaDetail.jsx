import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import IndexRow, { itemToRowProps } from "../components/IndexRow";
import UploadModal from "../components/UploadModal";
import ConfirmModal from "../components/ConfirmModal";
import { getIdea, deleteIdea } from "../api/ideas";
import { listPhotosForIdea, uploadPhoto } from "../api/photos";
import { listArtForIdea, uploadArt } from "../api/art";
import { USER_ID } from "../api/client";
import { COLOR, FONT } from "../theme";

// A prompt can be answered with either a photo or a piece of art — both
// just show up here together, newest first, same as Feed.jsx merges the
// two for the main feed.
export default function IdeaDetail({ ideaId, onBack, onOpenPhoto, onOpenArt }) {
  const [idea, setIdea] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  // Shared by the initial load and by the upload modal's onSubmit, so a
  // fresh submission shows up immediately without a full page reload.
  async function load() {
    try {
      const [i, photos, art] = await Promise.all([
        getIdea(ideaId),
        listPhotosForIdea(ideaId),
        listArtForIdea(ideaId),
      ]);
      setIdea(i);
      const merged = [
        ...photos.photos.map((p) => ({ ...p, kind: "photo" })),
        ...art.art.map((a) => ({ ...a, kind: "art" })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(merged);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, [ideaId]);

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteIdea(ideaId);
      onBack();
    } catch (e) {
      setError(e.message);
      setBusy(false);
      setShowDeleteConfirm(false);
    }
  }

  if (error) return <div className="text-sm p-4" style={{ color: COLOR.danger }}>{error}</div>;
  if (!idea) return <div className="text-sm p-4" style={{ color: COLOR.dim }}>Loading…</div>;

  const removed = idea.status === "deleted";

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm" style={{ color: COLOR.dim }}>
          <ArrowLeft size={15} /> Back
        </button>
        {!removed && idea.ownerId === USER_ID && (
          <button onClick={() => setShowDeleteConfirm(true)} className="text-xs" style={{ color: COLOR.danger }}>
            Delete
          </button>
        )}
      </div>

      <div className="pb-5 mb-6" style={{ borderBottom: `1px solid ${COLOR.line}` }}>
        {removed ? (
          <div className="text-sm" style={{ color: COLOR.dim, fontStyle: "italic" }}>
            This prompt was removed by its owner.
          </div>
        ) : (
          <>
            <div className="text-lg leading-snug" style={{ fontFamily: FONT.serif, fontStyle: "italic", color: COLOR.ink }}>
              "{idea.text}"
            </div>
            <div
              className="text-[10px] mt-2"
              style={{ fontFamily: FONT.sans, color: COLOR.dim, letterSpacing: "0.05em", textTransform: "uppercase" }}
            >
              — {idea.ownerUsername}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mb-1">
        <div
          className="text-[9.5px]"
          style={{ fontFamily: FONT.sans, letterSpacing: "0.16em", textTransform: "uppercase", color: COLOR.dim }}
        >
          Responses · {items.length}
        </div>
        {!removed && (
          <button onClick={() => setShowUpload(true)} className="text-xs" style={{ color: COLOR.accent }}>
            Answer this
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-sm py-8 text-center" style={{ color: COLOR.dim, border: `1px dashed ${COLOR.line}`, borderRadius: 3 }}>
          Nothing yet — be the first to answer this prompt.
        </div>
      ) : (
        <div>
          {items.map((item) => (
            <IndexRow
              key={`${item.kind}-${item.id}`}
              {...itemToRowProps(item)}
              onClick={() => (item.kind === "art" ? onOpenArt(item.id) : onOpenPhoto(item.id))}
            />
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          title="Answer this prompt"
          onSubmit={({ file, title, medium, description }) =>
            medium === "Photograph"
              ? uploadPhoto({ file, title, description, ideaId }).then(load)
              : uploadArt({ ideaId, file, title, medium, description }).then(load)
          }
          onClose={() => setShowUpload(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete this prompt?"
          message="Photos and art already submitted will stay up — they'll just show as inspired by a removed prompt."
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
