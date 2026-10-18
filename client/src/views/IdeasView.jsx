import { useEffect, useState } from "react";
import { listIdeas, createIdea } from "../api/ideas";
import IdeaModal from "../components/IdeaModal";
import { COLOR, FONT } from "../theme";

// Prompts for people who want to make something but don't know what of yet
// — deliberately text-only, no image to frame. People can answer a prompt
// with either a photo or a piece of art (see IdeaDetail.jsx), so this is
// just "prompts," not "photo prompts."
export default function IdeasView({ onOpen }) {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  function load() {
    return listIdeas({ limit: 50 })
      .then((d) => setIdeas(d.ideas))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-1">
        <div
          className="text-[10px]"
          style={{ fontFamily: FONT.sans, letterSpacing: "0.2em", textTransform: "uppercase", color: COLOR.accent }}
        >
          Prompts
        </div>
        <button onClick={() => setShowModal(true)} className="text-xs" style={{ color: COLOR.accent }}>
          Submit a prompt
        </button>
      </div>
      <p className="text-xs mb-5" style={{ color: COLOR.dim }}>
        Commissions from the community — answer one with a photo or a piece of art.
      </p>

      {error && <div className="text-sm" style={{ color: COLOR.danger }}>{error}</div>}
      {!error && loading && <div className="text-sm" style={{ color: COLOR.dim }}>Loading…</div>}
      {!error && !loading && ideas.length === 0 && (
        <div className="text-sm py-8 text-center" style={{ color: COLOR.dim, border: `1px dashed ${COLOR.line}`, borderRadius: 3 }}>
          No prompts yet — be the first to suggest one.
        </div>
      )}

      <div>
        {ideas.map((idea, i) => (
          <div
            key={idea.id}
            onClick={() => onOpen(idea.id)}
            style={{ padding: "14px 0", borderTop: i === 0 ? "none" : `1px solid ${COLOR.line}`, cursor: "pointer" }}
          >
            <div className="text-[9.5px]" style={{ fontFamily: FONT.sans, color: COLOR.dim }}>No. {i + 1}</div>
            <div className="text-sm leading-snug mt-1" style={{ fontFamily: FONT.serif, fontStyle: "italic", color: COLOR.ink }}>
              "{idea.text}"
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[9.5px]" style={{ fontFamily: FONT.sans, color: COLOR.dim }}>{idea.ownerUsername}</span>
              <span className="text-[9.5px]" style={{ fontFamily: FONT.sans, color: COLOR.accent }}>Answer this →</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <IdeaModal onSubmit={(text) => createIdea({ text }).then(load)} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
