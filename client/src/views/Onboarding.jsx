import { useEffect, useState } from "react";
import Plate from "../components/Plate";
import { listPhotos } from "../api/photos";
import { COLOR, FONT } from "../theme";

// Votes aren't persisted yet — there's no taste-vector endpoint server-side.
// This advances through real photos so the flow is testable end to end;
// wire vote() to POST /taste/swipes once that endpoint exists.
export default function Onboarding({ onDone }) {
  const [photos, setPhotos] = useState([]);
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPhotos({ limit: 10 }).then((d) => setPhotos(d.photos)).finally(() => setLoading(false));
  }, []);

  function vote() {
    if (i + 1 >= photos.length) onDone();
    else setI(i + 1);
  }

  if (loading) return <div className="text-sm p-4" style={{ color: COLOR.dim }}>Loading…</div>;

  if (photos.length === 0) {
    return (
      <div className="text-sm p-8 text-center" style={{ color: COLOR.dim }}>
        No plates to page through yet.
        <button onClick={onDone} className="block mt-3 text-sm underline mx-auto" style={{ color: COLOR.accent }}>Skip to plates</button>
      </div>
    );
  }

  const card = photos[i];
  const votes = ["Pass", "Meh", "Like", "Admire"];

  return (
    <div className="p-4 flex flex-col items-center">
      <div className="text-center mb-4">
        <div className="text-[10px]" style={{ fontFamily: FONT.sans, letterSpacing: "0.2em", textTransform: "uppercase", color: COLOR.accent }}>
          Find your inspiration
        </div>
        <div className="text-xs mt-1" style={{ color: COLOR.dim }}>{i + 1} of {photos.length}</div>
      </div>
      <div className="w-full max-w-sm">
        <Plate item={card} />
      </div>
      <div className="flex items-center gap-2 mt-5">
        {votes.map((label, idx) => (
          <button
            key={label}
            onClick={vote}
            className="text-xs px-3.5 py-2"
            style={{
              fontFamily: FONT.sans,
              border: `1px solid ${idx === votes.length - 1 ? COLOR.accent : COLOR.line}`,
              color: idx === votes.length - 1 ? COLOR.accent : COLOR.dim,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
