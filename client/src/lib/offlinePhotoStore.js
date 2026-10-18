// The actual "local database" for Inzzpired mode — once a photo's image
// bytes are in here, PhotoWorkspace.jsx never needs the network to display
// or work on it again. Deliberately separate from the server's
// working_photos table (which just remembers *that* you're working on a
// photo, for the "continue working" list on your profile) — that's a sync
// marker; this is the offline asset itself, and it never leaves the device.
const DB_NAME = "inzzpo-offline";
const STORE = "photos";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// record is { blob, title } — the title rides along so PhotoWorkspace can
// show something more than a bare image when reopened with zero network
// (title alone isn't worth a whole separate store).
export async function saveOfflinePhoto(photoId, record) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record, photoId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflinePhoto(photoId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(photoId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// Grid size/color and shade mode are per-photo working preferences, not
// asset data — kept on the same record (alongside blob/title) so reopening
// a photo restores exactly how it was left, with one merge-and-put rather
// than a second store to keep in sync.
export async function saveOfflineWorkspace(photoId, workspace) {
  const db = await openDb();
  const existing = await getOfflinePhoto(photoId);
  if (!existing) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ ...existing, workspace }, photoId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteOfflinePhoto(photoId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(photoId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
