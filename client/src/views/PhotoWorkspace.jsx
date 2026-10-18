import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Trash2, Grid3x3, Sparkles, ZoomOut } from "lucide-react";
import GridOverlay, { LINE_COLORS, GRID_SIZE_MIN, GRID_SIZE_MAX } from "../components/GridOverlay";
import ConfirmModal from "../components/ConfirmModal";
import { getPhoto, stopWorkingOn } from "../api/photos";
import { getOfflinePhoto, saveOfflinePhoto, saveOfflineWorkspace, deleteOfflinePhoto } from "../lib/offlinePhotoStore";
import { API_URL } from "../api/client";
import { COLOR, FONT } from "../theme";

const SHADE_MODES = [
  { id: "original", label: "Original" },
  { id: "shadows", label: "Shadows" },
  { id: "midtones", label: "Midtones" },
  { id: "highlights", label: "Highlights" },
];

// Luminance cutoffs (0-255) for each shade mode — pixels inside the range
// read as black, everything else fades toward white the further it is from
// the band, over FEATHER units. That gradient falloff (instead of a hard
// in-range/out-of-range cutoff) is what keeps the isolated band from
// looking like a jagged photocopy.
const SHADE_RANGES = { shadows: [0, 85], midtones: [85, 170], highlights: [170, 256] };
const FEATHER = 28;

const DEFAULT_WORKSPACE = { gridOn: false, gridSize: 4, lineColorId: "brass", shadeMode: "original" };

// "Inzzpired" mode — a focused, offline-first surface for working from a
// reference photo. Reads the image out of IndexedDB (see
// offlinePhotoStore.js), never the network, once it's cached — that's the
// whole point of saving it here instead of just linking back to Detail.jsx.
// Grid/shade/zoom preferences ride on the same offline record (see
// saveOfflineWorkspace) so reopening a photo restores the setup exactly as
// it was left, not back at defaults.
export default function PhotoWorkspace({ photoId, onClose, onRemoved }) {
  const [record, setRecord] = useState(null); // { blob, title, workspace }
  const [imgUrl, setImgUrl] = useState(null);
  const [error, setError] = useState(null);
  const [gridOn, setGridOn] = useState(DEFAULT_WORKSPACE.gridOn);
  const [gridSize, setGridSize] = useState(DEFAULT_WORKSPACE.gridSize);
  const [lineColorId, setLineColorId] = useState(DEFAULT_WORKSPACE.lineColorId);
  const [shadeMode, setShadeMode] = useState(DEFAULT_WORKSPACE.shadeMode);
  const [zoomCell, setZoomCell] = useState(null); // {row, col} or null
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    skipSaveRef.current = true;
    setZoomCell(null);
    setPan({ x: 0, y: 0 });
    (async () => {
      try {
        let rec = await getOfflinePhoto(photoId);
        if (!rec) {
          // Not cached yet (opened before caching finished, or the cache
          // was cleared) — one network fetch to bootstrap it, then it's
          // saved so every later open is fully offline.
          const photo = await getPhoto(photoId);
          const res = await fetch(`${API_URL}/uploads/${photo.storageKey}`);
          const blob = await res.blob();
          rec = { blob, title: photo.title };
          await saveOfflinePhoto(photoId, rec);
        }
        if (cancelled) return;
        setRecord(rec);
        setImgUrl(URL.createObjectURL(rec.blob));
        const ws = { ...DEFAULT_WORKSPACE, ...rec.workspace };
        setGridOn(ws.gridOn);
        setGridSize(ws.gridSize);
        setLineColorId(ws.lineColorId);
        setShadeMode(ws.shadeMode);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photoId]);

  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
  }, [imgUrl]);

  // Skips the run this effect would otherwise fire right after the load
  // effect above hydrates state from the saved record — that's a restore,
  // not a change, and shouldn't write straight back.
  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    saveOfflineWorkspace(photoId, { gridOn, gridSize, lineColorId, shadeMode });
  }, [photoId, gridOn, gridSize, lineColorId, shadeMode]);

  useEffect(() => {
    if (shadeMode === "original" || !imgRef.current || !canvasRef.current) return;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const draw = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const [lo, hi] = SHADE_RANGES[shadeMode];
      for (let i = 0; i < data.data.length; i += 4) {
        const luminance = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
        const inBand = luminance >= lo && luminance < hi;
        const dist = inBand ? 0 : Math.min(Math.abs(luminance - lo), Math.abs(luminance - hi));
        const v = inBand ? 0 : Math.round(Math.min(dist / FEATHER, 1) * 255);
        data.data[i] = v;
        data.data[i + 1] = v;
        data.data[i + 2] = v;
      }
      ctx.putImageData(data, 0, 0);
    };
    if (img.complete) draw();
    else img.onload = draw;
  }, [shadeMode, imgUrl]);

  function clampAxis(total) {
    const min = (1 - gridSize) * 100;
    return Math.min(0, Math.max(min, total));
  }

  function baseTranslate(cell) {
    if (!cell) return { x: 0, y: 0 };
    return { x: 50 - (cell.col + 0.5) * 100, y: 50 - (cell.row + 0.5) * 100 };
  }

  function handleViewportClick(e) {
    if (!gridOn || zoomCell) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const col = Math.min(gridSize - 1, Math.max(0, Math.floor(relX * gridSize)));
    const row = Math.min(gridSize - 1, Math.max(0, Math.floor(relY * gridSize)));
    setPan({ x: 0, y: 0 });
    setZoomCell({ row, col });
  }

  function exitZoom() {
    setZoomCell(null);
    setPan({ x: 0, y: 0 });
  }

  function handlePointerDown(e) {
    if (!zoomCell) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originPan: pan, moved: false };
    setPanning(true);
  }
  function handlePointerMove(e) {
    if (!dragRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const dxPct = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    if (Math.abs(dxPct) > 1 || Math.abs(dyPct) > 1) dragRef.current.moved = true;
    const base = baseTranslate(zoomCell);
    setPan({
      x: clampAxis(base.x + dragRef.current.originPan.x + dxPct) - base.x,
      y: clampAxis(base.y + dragRef.current.originPan.y + dyPct) - base.y,
    });
  }
  function handlePointerUp() {
    if (!dragRef.current) return;
    const moved = dragRef.current.moved;
    dragRef.current = null;
    setPanning(false);
    if (!moved) exitZoom();
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await stopWorkingOn(photoId);
      await deleteOfflinePhoto(photoId);
      onRemoved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
      setShowRemoveConfirm(false);
    }
  }

  if (error) return <div className="p-4 text-sm" style={{ color: COLOR.danger }}>{error}</div>;
  if (!imgUrl) return <div className="p-4 text-sm" style={{ color: COLOR.dim }}>Loading…</div>;

  const lineColor = LINE_COLORS.find((c) => c.id === lineColorId)?.value || COLOR.accent;
  const base = baseTranslate(zoomCell);
  const totalX = zoomCell ? base.x + pan.x : 0;
  const totalY = zoomCell ? base.y + pan.y : 0;
  const scale = zoomCell ? gridSize : 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: COLOR.bg }}>
      <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${COLOR.line}` }}>
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm" style={{ color: COLOR.dim }}>
          <ArrowLeft size={15} /> Pause
        </button>
        <div className="text-sm truncate mx-2" style={{ fontFamily: FONT.serif, fontStyle: "italic", color: COLOR.ink }}>
          {record?.title || "Untitled"}
        </div>
        <button
          onClick={() => setShowRemoveConfirm(true)}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 flex-shrink-0"
          style={{ border: `1px solid ${COLOR.danger}`, borderRadius: 999, color: COLOR.danger }}
        >
          <Trash2 size={12} /> Remove
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div
          ref={viewportRef}
          className="relative w-full overflow-hidden"
          style={{ maxWidth: 480, borderRadius: 4, cursor: zoomCell ? (panning ? "grabbing" : "grab") : gridOn ? "zoom-in" : "default" }}
          onClick={handleViewportClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div
            style={{
              transform: `translate(${totalX}%, ${totalY}%) scale(${scale})`,
              transformOrigin: "0 0",
              transition: panning ? "none" : "transform 0.25s ease",
            }}
          >
            <img
              ref={imgRef}
              src={imgUrl}
              alt=""
              className="w-full block"
              draggable={false}
              style={{ display: shadeMode === "original" ? "block" : "none" }}
            />
            <canvas ref={canvasRef} className="w-full block" style={{ display: shadeMode === "original" ? "none" : "block" }} />
            <GridOverlay size={gridOn ? gridSize : 0} color={lineColor} />
          </div>

          {zoomCell && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                exitZoom();
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5"
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                borderRadius: 999,
                background: "rgba(12,18,14,0.75)",
                color: COLOR.accent,
                zIndex: 2,
              }}
            >
              <ZoomOut size={12} /> Zoom out
            </button>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4" style={{ borderTop: `1px solid ${COLOR.line}` }}>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3x3 size={13} style={{ color: COLOR.dim }} />
              <span className="text-xs" style={{ color: COLOR.dim }}>
                Grid {gridOn ? `· ${gridSize}×${gridSize}` : ""}
              </span>
            </div>
            <button
              onClick={() => setGridOn((v) => !v)}
              className="text-xs px-2.5 py-1"
              style={{
                borderRadius: 999,
                border: `1px solid ${gridOn ? COLOR.accent : COLOR.line}`,
                color: gridOn ? COLOR.accent : COLOR.dim,
                background: COLOR.surface,
              }}
            >
              {gridOn ? "On" : "Off"}
            </button>
          </div>

          {gridOn && (
            <>
              <input
                type="range"
                min={GRID_SIZE_MIN}
                max={GRID_SIZE_MAX}
                step={1}
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                style={{ width: "100%", accentColor: COLOR.accent }}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: COLOR.dim }}>Line color</span>
                <div className="flex gap-1.5">
                  {LINE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setLineColorId(c.id)}
                      aria-label={c.label}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: c.value,
                        border: `2px solid ${lineColorId === c.id ? COLOR.accent : "transparent"}`,
                        boxShadow: `0 0 0 1px ${COLOR.line}`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Sparkles size={13} style={{ color: COLOR.dim }} />
            <span className="text-xs" style={{ color: COLOR.dim }}>Shades</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {SHADE_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setShadeMode(m.id)}
                className="text-xs px-2.5 py-1"
                style={{
                  borderRadius: 999,
                  border: `1px solid ${shadeMode === m.id ? COLOR.accent : COLOR.line}`,
                  color: shadeMode === m.id ? COLOR.accent : COLOR.dim,
                  background: COLOR.surface,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showRemoveConfirm && (
        <ConfirmModal
          title="Remove this from your working list?"
          message="It'll no longer show up under Working On in your profile, and its offline copy is deleted from this device."
          confirmLabel="Remove"
          busy={busy}
          onConfirm={handleRemove}
          onCancel={() => setShowRemoveConfirm(false)}
        />
      )}
    </div>
  );
}
