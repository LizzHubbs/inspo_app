import { useState } from "react";
import TopNav from "./components/TopNav";
import BottomNav from "./components/BottomNav";
import UploadModal from "./components/UploadModal";
import Feed from "./views/Feed";
import Detail from "./views/Detail";
import ArtDetail from "./views/ArtDetail";
import SearchView from "./views/SearchView";
import Profile from "./views/Profile";
import IdeasView from "./views/IdeasView";
import IdeaDetail from "./views/IdeaDetail";
import UserProfile from "./views/UserProfile";
import SettingsView from "./views/SettingsView";
import GoalsView from "./views/GoalsView";
import PhotoWorkspace from "./views/PhotoWorkspace";
import Onboarding from "./views/Onboarding";
import { uploadPhoto } from "./api/photos";
import { uploadArt } from "./api/art";
import { COLOR, FONT } from "./theme";

export default function App() {
  const [view, setView] = useState("onboarding");
  // photoId/artId/ideaId/viewingUserId float above `view` on purpose —
  // opening a photo from Search or Profile should come back to Search or
  // Profile, not jump to Feed, so "which tab is underneath" and "what's
  // open on top of it" are tracked separately. ideaId and viewingUserId are
  // siblings (mutually exclusive containers — opening one clears the
  // other); artId > photoId nest inside whichever of those is active.
  const [photoId, setPhotoId] = useState(null);
  const [artId, setArtId] = useState(null);
  const [ideaId, setIdeaId] = useState(null);
  const [viewingUserId, setViewingUserId] = useState(null);
  // Settings is a leaf, not a container — nothing opens further from it,
  // so it just overrides everything else while open instead of nesting.
  const [showSettings, setShowSettings] = useState(false);
  // Same "overrides everything" treatment as Settings, and for the same
  // reason: Inzzpired mode is meant to be a distraction-free, offline
  // workspace, not another screen nested under the normal nav chrome.
  const [workspacePhotoId, setWorkspacePhotoId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  // Bumping this re-triggers Feed's fetch effect — see views/Feed.jsx.
  const [feedKey, setFeedKey] = useState(0);

  function navigate(v) {
    setView(v);
    setPhotoId(null);
    setArtId(null);
    setIdeaId(null);
    setViewingUserId(null);
    setShowSettings(false);
  }

  function openUserProfile(id) {
    setPhotoId(null);
    setArtId(null);
    setIdeaId(null);
    setViewingUserId(id);
  }

  function openIdea(id) {
    setPhotoId(null);
    setArtId(null);
    setViewingUserId(null);
    setIdeaId(id);
  }

  return (
    <div className="w-full" style={{ background: COLOR.bg, color: COLOR.ink, minHeight: "100vh", fontFamily: FONT.sans }}>
      <style>{`
        html, body { -webkit-tap-highlight-color: transparent; overscroll-behavior-y: contain; background: ${COLOR.bg}; }
      `}</style>

      {workspacePhotoId ? (
        <PhotoWorkspace
          photoId={workspacePhotoId}
          onClose={() => setWorkspacePhotoId(null)}
          onRemoved={() => setWorkspacePhotoId(null)}
        />
      ) : (
        <>
          {view !== "onboarding" && <TopNav view={view} setView={navigate} />}

          <div style={{ paddingBottom: view !== "onboarding" ? "calc(60px + env(safe-area-inset-bottom))" : 0 }}>
            {view === "onboarding" && <Onboarding onDone={() => setView("feed")} />}

            {showSettings && <SettingsView onBack={() => setShowSettings(false)} />}

            {!showSettings && !photoId && !artId && !ideaId && !viewingUserId && view === "feed" && (
              <Feed onOpenPhoto={setPhotoId} onOpenArt={setArtId} refreshKey={feedKey} />
            )}
            {!showSettings && !photoId && !artId && !ideaId && !viewingUserId && view === "search" && (
              <SearchView onOpen={setPhotoId} onOpenUser={openUserProfile} />
            )}
            {!showSettings && !photoId && !artId && !ideaId && !viewingUserId && view === "profile" && (
              <Profile
                onOpen={setPhotoId}
                onOpenArt={setArtId}
                onOpenUser={openUserProfile}
                onOpenSettings={() => setShowSettings(true)}
                onOpenWorking={setWorkspacePhotoId}
              />
            )}
            {!showSettings && !photoId && !artId && !ideaId && !viewingUserId && view === "ideas" && (
              <IdeasView onOpen={setIdeaId} />
            )}
            {!showSettings && !photoId && !artId && !ideaId && !viewingUserId && view === "goals" && (
              <GoalsView />
            )}

            {!showSettings && photoId && !artId && (
              <Detail
                photoId={photoId}
                onBack={() => setPhotoId(null)}
                onOpenArt={setArtId}
                onOpenIdea={openIdea}
                onWorkOn={setWorkspacePhotoId}
              />
            )}

            {!showSettings && artId && (
              <ArtDetail
                artId={artId}
                onBack={(parent) => {
                  if (parent?.type === "photo") {
                    setArtId(null);
                    setPhotoId(parent.id);
                  } else if (parent?.type === "art") {
                    setArtId(parent.id);
                  } else if (parent?.type === "idea") {
                    openIdea(parent.id);
                  } else {
                    setArtId(null);
                  }
                }}
                onOpenArt={setArtId}
                onOpenIdea={openIdea}
              />
            )}

            {!showSettings && !photoId && !artId && ideaId && (
              <IdeaDetail ideaId={ideaId} onBack={() => setIdeaId(null)} onOpenPhoto={setPhotoId} onOpenArt={setArtId} />
            )}

            {!showSettings && !photoId && !artId && !ideaId && viewingUserId && (
              <UserProfile
                userId={viewingUserId}
                onBack={() => setViewingUserId(null)}
                onOpenPhoto={setPhotoId}
                onOpenArt={setArtId}
              />
            )}
          </div>

          {view !== "onboarding" && (
            <BottomNav view={view} setView={navigate} onUpload={() => setShowUpload(true)} />
          )}

          {showUpload && (
            <UploadModal
              title="Submit a plate"
              onSubmit={({ file, title, medium, description }) =>
                medium === "Photograph"
                  ? uploadPhoto({ file, title, description }).then(() => setFeedKey((k) => k + 1))
                  : uploadArt({ file, title, description, medium })
              }
              onClose={() => setShowUpload(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
