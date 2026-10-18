# inspo-app

Client + server in one place.

```
inspo-app/
  server/    Express + Postgres API — see server/README.md
  client/    Vite + React frontend, talks to the API over HTTP
```

## Run both

Two terminals — nothing fancy, keeps it obvious which logs belong to which
process while you're debugging.

**Terminal 1 — server:**
```bash
cd server
npm install
cp .env.example .env
docker compose up -d
npm run migrate
npm run dev              # http://localhost:4000
```
Then seed a user (no signup endpoint yet — see server/README.md for the full
command):
```bash
docker compose exec postgres psql -U postgres -d inspo \
  -c "insert into users (id, username) values ('11111111-1111-1111-1111-111111111111', 'you');"
```

**Terminal 2 — client:**
```bash
cd client
npm install
cp .env.example .env     # VITE_USER_ID must match the id you seeded above
npm run dev               # http://localhost:5173
```

Open `http://localhost:5173`. The onboarding screen will say "no photos to
swipe on yet" the first run — that's correct, the database is empty. Tap
"Skip to feed", then use the red `+` button to upload your first photo.

## How the client talks to the server

`client/src/api/` is the only place that knows the server exists:

- `client.js` — the shared `fetch` wrapper, reads `VITE_API_URL` and attaches
  the `x-user-id` header
- `photos.js` — list/get/upload photos
- `art.js` — list/upload art for a photo

Every view imports from here, never calls `fetch` directly — if a request is
misbehaving, this folder is where to look first, and `server/README.md`'s
debugging section covers the other side of the same request.

## What's stubbed, so you don't go looking for it

- **Auth** — `x-user-id` header, no real login
- **Search** — plain text match client-side, not the embedding search from
  the design (see the comment in `client/src/views/SearchView.jsx`)
- **Taste vector / swipe persistence** — onboarding swipes don't save
  anywhere yet (see the comment in `client/src/views/Onboarding.jsx`)
- **"My art" on profile** — needs a new server endpoint that doesn't exist
  yet (per-photo art listing does, a cross-photo one doesn't)
- **Moderation** — always passes (`server/src/utils/moderation.ts`)

## Suggested next slices

1. `GET /users/:id/art` on the server → unblocks the Profile "Art" tab
2. A real `POST /taste/swipes` endpoint → onboarding starts meaning something
3. Swap `SearchView`'s client-side filter for a real `/search` call once the
   embedding pipeline exists
