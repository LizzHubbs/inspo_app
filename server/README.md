# inspo-api

Photo upload + inspiration-graph API. Node/TypeScript + Express + Postgres.

## Layout

Each feature is a self-contained module with the same five files, so once
you know the pattern in `photos/`, `art/` reads the same way:

```
src/
  config/          env vars, db pool
  lib/storage/     StorageAdapter interface + local-disk implementation
  middleware/      error handler, placeholder auth
  modules/
    photos/
      photo.types.ts        the Photo shape
      photo.repository.ts   raw SQL, one function per query
      photo.service.ts      validation + business rules, calls repository
      photo.controller.ts   reads req, calls service, shapes the response
      photo.routes.ts       wires HTTP verbs + paths to controller functions
    art/
      (same five files, plus art.routes.byId.ts for GET /art/:id)
  utils/           HttpError, asyncHandler, moderation stub
  app.ts           middleware + route mounting, in order
  server.ts        just calls app.listen()
db/schema.sql      the whole schema, run once to set up tables
```

Request flow is always: **routes → controller → service → repository → db**.
If something's broken, that's the order to trace it in — e.g. a wrong photo
title means look at controller (is it reading `req.body.title`?) before
service, before repository.

## Setup

```bash
npm install
cp .env.example .env
docker compose up -d          # starts Postgres on localhost:5432
npm run migrate               # applies db/schema.sql
npm run dev                   # starts the API on :4000 with auto-reload
```

No real auth yet — every request needs an `x-user-id` header with any UUID
you like; `middleware/currentUser.ts` just reads it. You'll also need a row
in the `users` table first (there's no signup endpoint yet):

```bash
docker compose exec postgres psql -U postgres -d inspo \
  -c "insert into users (id, username) values ('11111111-1111-1111-1111-111111111111', 'you');"
```

## Endpoints

| Method | Path                | Body                          | Notes                                  |
|--------|---------------------|--------------------------------|-----------------------------------------|
| GET    | /photos              | —                              | `?limit=20&before=<createdAt cursor>`   |
| GET    | /photos/:id          | —                              |                                          |
| POST   | /photos              | multipart: `image`, `title?`, `tag?` | requires `x-user-id`             |
| GET    | /photos/:id/art       | —                              | the inspiration-graph read              |
| POST   | /photos/:id/art       | multipart: `image`, `title?`   | requires `x-user-id`; 404s if photo missing |
| GET    | /art/:id              | —                              |                                          |
| GET    | /health               | —                              | liveness check                          |

Example upload:

```bash
curl -X POST http://localhost:4000/photos \
  -H "x-user-id: 11111111-1111-1111-1111-111111111111" \
  -F "image=@./sample.jpg" \
  -F "title=Low tide, dusk" \
  -F "tag=moody coastal"
```

## Debugging notes

- **Every request is logged** (via `morgan`) — check stdout first for the
  method/path/status before digging further.
- **A hung request with no error response** almost always means a route
  handler wasn't wrapped in `asyncHandler(...)` — see `utils/asyncHandler.ts`
  for why that matters.
- **`/photos/:id/art` says photo not found but you're sure it exists** —
  check `art.routes.ts` has `Router({ mergeParams: true })`; without it,
  `req.params.photoId` is `undefined` inside the nested router even though
  it's in the URL.
- **All errors are shaped `{ error: "message" }`** with the right status
  code, as long as they're thrown as `HttpError` (see `utils/httpError.ts`).
  Anything else thrown becomes a `500` and gets fully logged server-side —
  that's the signal it's a real bug, not an expected validation failure.
- **Moderation always passes right now** — `utils/moderation.ts` is a stub
  that returns `{ status: "live" }` unconditionally. That's intentional
  until a real classifier is wired in; look here first if a photo you
  expected to be rejected went live instead.
