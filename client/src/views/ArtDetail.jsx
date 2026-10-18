import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Plate from "../components/Plate";
import IndexRow, { itemToRowProps } from "../components/IndexRow";
import ConfirmModal from "../components/ConfirmModal";
import EditModal from "../components/EditModal";
import UploadModal from "../components/UploadModal";
import { getArt, listArtForPhoto, listArtForArt, updateArt, deleteArt, loveArt, unloveArt, uploadArt } from "../api/art";
import { getPhoto } from "../api/photos";
import { getIdea } from "../api/ideas";
import { USER_ID } from "../api/client";
import { COLOR, FONT } from "../theme";

// A closer look at one piece of art: what it was inspired by (a photo,
// another piece of art, an idea, or nothing), every other piece inspired
// by that same photo (siblings), and every piece inspired by THIS one
// (children) — so the whole photo -> art -> art -> ... chain is walkable
// in either direction.
export default function ArtDetail({ artId, onBack, onOpenArt, onOpenIdea }) {
  const [art, setArt] = useState(null);
  const [parent, setParent] = useState(null); // { type: "photo"|"art"|"idea", data }
  const [siblings, setSiblings] = useState([]);
  const [children, setChildren] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  async function load() {
    const a = await getArt(artId);
    setArt(a);

    if (a.inspiredByPhoto) {
      // A deleted photo isn't a 404 — deletion just flips its status, so
      // this still resolves and we can render "removed" instead of erroring.
      const [p, list] = await Promise.all([getPhoto(a.inspiredByPhoto), listArtForPhoto(a.inspiredByPhoto)]);
      setParent({ type: "photo", data: p });
      setSiblings(list.art);
    } else if (a.inspiredByArt) {
      const p = await getArt(a.inspiredByArt);
      setParent({ type: "art", data: p });
      setSiblings([]);
    } else if (a.inspiredByIdea) {
      const p = await getIdea(a.inspiredByIdea);
      setParent({ type: "idea", data: p });
      setSiblings([]);
    } else {
      setParent(null);
      setSiblings([]);
    }

    const kids = await listArtForArt(artId);
    setChildren(kids.art);
  }

  useEffect(() => {
    let cancelled = false;
    setArt(null);
    setError(null);
    load().catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [artId]);

  function handleBack() {
    if (parent?.type === "photo") onBack({ type: "photo", id: parent.data.id });
    else if (parent?.type === "art") onBack({ type: "art", id: parent.data.id });
    else if (parent?.type === "idea") onBack({ type: "idea", id: parent.data.id });
    else onBack(null);
  }

  async function handleToggleLove() {
    const updated = art.lovedByMe ? await unloveArt(artId) : await loveArt(artId);
    setArt(updated);
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteArt(artId);
      handleBack();
    } catch (e) {
      setError(e.message);
      setBusy(false);
      setShowDeleteConfirm(false);
    }
  }

  if (error) return <div className="text-sm p-4" style={{ color: COLOR.danger }}>{error}</div>;
  if (!art) return <div className="text-sm p-4" style={{ color: COLOR.dim }}>Loading…</div>;

  const removed = art.status === "deleted";

  const backLabel =
    parent?.type === "photo"
      ? parent.data.status !== "deleted"
        ? parent.data.title || "Back to photo"
        : "Back"
      : parent?.type === "art"
      ? parent.data.status !== "deleted"
        ? parent.data.title || "Back to art"
        : "Back"
      : parent?.type === "idea"
      ? "Back to prompt"
      : "Back";

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm" style={{ color: COLOR.dim }}>
          <ArrowLeft size={15} /> {backLabel}
        </button>
        {!removed && art.ownerId === USER_ID && (
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
          This art was removed by its owner.
        </div>
      ) : (
        <>
          <Plate item={art} onToggleLove={handleToggleLove} aspectRatio="1 / 1" />

          {parent?.type === "photo" && (
            <div className="text-xs mt-3" style={{ color: COLOR.dim }}>
              {parent.data.status === "deleted" ? "Inspired by a removed photo" : `Inspired by ${parent.data.title || "an untitled photo"}`}
            </div>
          )}
          {parent?.type === "art" && (
            <button onClick={() => onOpenArt(parent.data.id)} className="text-xs mt-3 text-left" style={{ color: COLOR.dim }}>
              {parent.data.status === "deleted"
                ? "Inspired by removed art"
                : `Inspired by ${parent.data.title || "another piece of art"}`}
            </button>
          )}
          {parent?.type === "idea" && (
            <button onClick={() => onOpenIdea(parent.data.id)} className="text-xs mt-3 text-left" style={{ color: COLOR.dim }}>
              {parent.data.status === "deleted" ? (
                "Inspired by a removed prompt"
              ) : (
                <>Inspired by the prompt <span style={{ color: COLOR.accent, fontStyle: "italic" }}>"{parent.data.text}"</span></>
              )}
            </button>
          )}
        </>
      )}

      {siblings.length > 0 && (
        <>
          <div
            className="text-[10px] mt-8 mb-1"
            style={{ fontFamily: FONT.sans, letterSpacing: "0.16em", textTransform: "uppercase", color: COLOR.dim }}
          >
            More from this photo
          </div>
          <div>
            {siblings.map((a) => (
              <IndexRow key={a.id} {...itemToRowProps(a)} onClick={a.id === artId ? undefined : () => onOpenArt(a.id)} />
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between mt-8 mb-1">
        <div
          className="text-[10px]"
          style={{ fontFamily: FONT.sans, letterSpacing: "0.16em", textTransform: "uppercase", color: COLOR.dim }}
        >
          Responses · {children.length}
        </div>
        {!removed && (
          <button onClick={() => setShowUpload(true)} className="text-xs" style={{ color: COLOR.accent }}>
            Add art
          </button>
        )}
      </div>

      {children.length === 0 ? (
        <div className="text-sm py-8 text-center" style={{ color: COLOR.dim, border: `1px dashed ${COLOR.line}`, borderRadius: 3 }}>
          Nothing yet — be the first to build on this.
        </div>
      ) : (
        <div>
          {children.map((a) => (
            <IndexRow key={a.id} {...itemToRowProps(a)} onClick={() => onOpenArt(a.id)} />
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          title="Add art inspired by this"
          onSubmit={({ file, title, medium, description }) =>
            uploadArt({ artId, file, title, medium, description }).then(load)
          }
          onClose={() => setShowUpload(false)}
        />
      )}

      {showEdit && (
        <EditModal
          initialTitle={art.title}
          initialDescription={art.description}
          initialMedium={art.medium}
          showMedium
          onSubmit={({ title, description, medium }) => updateArt(artId, { title, description, medium }).then(setArt)}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete this art?"
          message="This can't be undone."
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
