import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Plate from "../components/Plate";
import IndexRow, { itemToRowProps } from "../components/IndexRow";
import UploadModal from "../components/UploadModal";
import ConfirmModal from "../components/ConfirmModal";
import EditModal from "../components/EditModal";
import { getPhoto, updatePhoto, deletePhoto, lovePhoto, unlovePhoto, startWorkingOn } from "../api/photos";
import { listArtForPhoto, uploadArt } from "../api/art";
import { getIdea } from "../api/ideas";
import { saveOfflinePhoto } from "../lib/offlinePhotoStore";
import { USER_ID, API_URL } from "../api/client";
import { COLOR, FONT } from "../theme";

export default function Detail({ photoId, onBack, onOpenArt, onOpenIdea, onWorkOn }) {
  const [photo, setPhoto] = useState(null);
  const [art, setArt] = useState([]);
  const [idea, setIdea] = useState(null);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [startingWork, setStartingWork] = useState(false);

  // Shared by the initial load and by the upload modal's onSubmit, so a
  // fresh art upload shows up immediately without a full page reload.
  async function load() {
    try {
      const [p, a] = await Promise.all([getPhoto(photoId), listArtForPhoto(photoId)]);
      setPhoto(p);
      setArt(a.art);
      setIdea(p.inspiredByIdea ? await getIdea(p.inspiredByIdea) : null);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, [photoId]);

  async function handleToggleLove() {
    const updated = photo.lovedByMe ? await unlovePhoto(photoId) : await lovePhoto(photoId);
    setPhoto(updated);
  }

  // Caches the image locally first (so PhotoWorkspace never needs the
  // network once it's open), then records the save server-side (so it
  // shows up under Working Proofs on the profile from any device), then
  // hands off to the workspace itself.
  async function handleWorkOn() {
    setStartingWork(true);
    try {
      const res = await fetch(`${API_URL}/uploads/${photo.storageKey}`);
      const blob = await res.blob();
      await saveOfflinePhoto(photoId, { blob, title: photo.title });
      await startWorkingOn(photoId);
      onWorkOn(photoId);
    } catch (e) {
      setError(e.message);
      setStartingWork(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deletePhoto(photoId);
      onBack();
    } catch (e) {
      setError(e.message);
      setBusy(false);
      setShowDeleteConfirm(false);
    }
  }

  if (error) return <div className="text-sm p-4" style={{ color: COLOR.danger }}>{error}</div>;
  if (!photo) return <div className="text-sm p-4" style={{ color: COLOR.dim }}>Loading…</div>;

  const removed = photo.status === "deleted";

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm" style={{ color: COLOR.dim }}>
          <ArrowLeft size={15} /> Back
        </button>
        {!removed && photo.ownerId === USER_ID && (
          <div className="flex items-center gap-3">
            <button onClick={() => setShowEdit(true)} className="text-xs" style={{ color: COLOR.accent }}>
              Edit
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="text-xs" style={{ color: COLOR.danger }}>
              Delete
            </button>
          </div>
        )}
      </div>

      {removed ? (
        <div
          className="text-sm py-16 text-center"
          style={{ color: COLOR.dim, border: `1px dashed ${COLOR.line}`, borderRadius: 3 }}
        >
          This photo was removed by its owner.
        </div>
      ) : (
        <>
          <Plate item={photo} onToggleLove={handleToggleLove} aspectRatio="1 / 1" />

          <div className="flex items-center justify-between mt-3">
            {photo.artCount > 0 ? (
              <div className="text-xs" style={{ color: COLOR.dim }}>Inspired {photo.artCount} piece{photo.artCount === 1 ? "" : "s"} of art</div>
            ) : <div />}
            <button
              onClick={handleWorkOn}
              disabled={startingWork}
              className="text-xs"
              style={{ color: COLOR.accent }}
            >
              {startingWork ? "Saving…" : "Work from this →"}
            </button>
          </div>

          {idea && (
            <button
              onClick={() => onOpenIdea(idea.id)}
              className="text-xs mt-3 text-left"
              style={{ color: COLOR.dim, letterSpacing: "0.02em" }}
            >
              {idea.status === "deleted" ? (
                "Answered a prompt that's since been removed"
              ) : (
                <>
                  Answers the prompt: <span style={{ color: COLOR.accent, fontStyle: "italic" }}>"{idea.text}"</span>
                </>
              )}
            </button>
          )}
        </>
      )}

      <div className="flex items-center justify-between mt-8 mb-1">
        <div
          className="text-[10px]"
          style={{ fontFamily: FONT.sans, letterSpacing: "0.16em", textTransform: "uppercase", color: COLOR.dim }}
        >
          Responses · {art.length}
        </div>
        {!removed && (
          <button onClick={() => setShowUpload(true)} className="text-xs" style={{ color: COLOR.accent }}>
            Add art
          </button>
        )}
      </div>

      {art.length === 0 ? (
        <div className="text-sm py-8 text-center" style={{ color: COLOR.dim, border: `1px dashed ${COLOR.line}`, borderRadius: 3 }}>
          No art yet — be the first to create from this photo.
        </div>
      ) : (
        <div>
          {art.map((a) => (
            <IndexRow key={a.id} {...itemToRowProps(a)} onClick={() => onOpenArt(a.id)} />
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          title="Add art inspired by this photo"
          onSubmit={({ file, title, medium, description }) =>
            uploadArt({ photoId, file, title, medium, description }).then(load)
          }
          onClose={() => setShowUpload(false)}
        />
      )}

      {showEdit && (
        <EditModal
          initialTitle={photo.title}
          initialDescription={photo.description}
          onSubmit={({ title, description }) => updatePhoto(photoId, { title, description }).then(setPhoto)}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete this photo?"
          message="Art already made from it will stay up — it'll just show as inspired by a removed photo."
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
