create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id),
  title text,
  storage_key text not null,
  status text not null default 'live' check (status in ('live', 'rejected', 'pending')),
  created_at timestamptz not null default now()
);
create index if not exists idx_photos_status_created on photos(status, created_at desc);

-- Tags were the original way to make a photo findable; description (below,
-- alongside title) replaced them — freer text, and it's something people
-- actually want to write and read, not keyword metadata. There's no photo
-- "medium" column: the unified upload form (UploadModal.jsx) treats
-- "Photograph" as the one medium choice that creates a Photo row instead
-- of an Art row, so every photo's medium is implicitly and always
-- "Photograph" — not worth storing.
alter table photos drop column if exists tags;
alter table photos add column if not exists description text;

-- Per-piece gallery placement — every photo/art piece hangs on its owner's
-- profile "museum wall" at its own exact spot, like a real wall hung by the
-- person who made the work. wall_x/wall_y are pixel offsets in the wall's
-- own coordinate space (null means "not placed yet" — the client
-- auto-lays it out in sequence rather than leaving it at a stored (0,0)).
-- Frame style/size and the plaque are no longer per-piece — they come from
-- the owner's chosen room_theme (see gallery_settings below) so every
-- piece in a room matches; frame_shape/frame_size (bento-grid era) and
-- frame_style/frame_width/plaque_show_medium (per-piece customizer era)
-- are both retired in favor of that.
alter table photos drop column if exists frame_shape;
alter table photos drop column if exists frame_size;
alter table photos drop column if exists frame_style;
alter table photos drop column if exists frame_width;
alter table photos drop column if exists plaque_show_medium;
alter table photos add column if not exists wall_x integer;
alter table photos add column if not exists wall_y integer;

create table if not exists art (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id),
  inspired_by uuid references photos(id),
  title text,
  storage_key text not null,
  status text not null default 'live' check (status in ('live', 'rejected', 'pending')),
  created_at timestamptz not null default now()
);

-- Same reasoning as photos: description replaces tags for search. Art also
-- gets medium, since — unlike a photo — there's real variety worth
-- recording (acrylic vs oil vs pencil vs a photographic response, etc.).
-- The allowed list mirrors the dropdown in UploadModal.jsx exactly; keep
-- them in sync if it ever changes.
alter table art add column if not exists description text;
alter table art add column if not exists medium text;
alter table art drop constraint if exists art_medium_check;
alter table art add constraint art_medium_check check (medium is null or medium in (
  'Photograph', 'Acrylic Paint', 'Oil Paint', 'Watercolor', 'Graphite Pencil',
  'Charcoal', 'Ink', 'Pastel', 'Digital Art', 'Mixed Media', 'Other'
));

-- Same per-piece museum-wall placement as photos (see the comment there).
alter table art drop column if exists frame_shape;
alter table art drop column if exists frame_size;
alter table art drop column if exists frame_style;
alter table art drop column if exists frame_width;
alter table art drop column if exists plaque_show_medium;
alter table art add column if not exists wall_x integer;
alter table art add column if not exists wall_y integer;
-- inspired_by started out required, but art doesn't have to be a response
-- to a photo — someone can just post a piece of art on its own, so this
-- needs its own explicit ALTER for existing databases (same reason other
-- nullable columns in this file do).
alter table art alter column inspired_by drop not null;
-- This is the index that keeps the "art for a photo" read fast as a photo's
-- responses grow, per the inspiration-graph design.
create index if not exists idx_art_inspired_by on art(inspired_by, created_at desc);

-- Art can also inspire more art (a chain, not just a single photo->art
-- hop) — inspired_by_idea_id (below, added once the ideas table exists)
-- rounds out the third possible parent. Separate nullable FK columns
-- rather than one polymorphic id column so the database still enforces
-- that each reference actually exists.
alter table art add column if not exists inspired_by_art_id uuid references art(id);
create index if not exists idx_art_inspired_by_art on art(inspired_by_art_id, created_at desc);

-- Text prompts ("a boat on a stormy sea") for people who want to go take a
-- photo but don't know what of yet. Deliberately not linked to a photo —
-- unlike art, an idea isn't a response to anything, it's the start of the
-- chain.
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id),
  text text not null,
  status text not null default 'live' check (status in ('live', 'rejected', 'pending')),
  created_at timestamptz not null default now()
);
create index if not exists idx_ideas_status_created on ideas(status, created_at desc);

-- Optional link from a photo back to the idea it fulfilled. Nullable —
-- most photos aren't shot in response to a prompt; this only gets set when
-- someone uploads via an idea's "Take this photo" flow.
alter table photos add column if not exists inspired_by_idea uuid references ideas(id);
create index if not exists idx_photos_inspired_by_idea on photos(inspired_by_idea, created_at desc);

-- Ideas aren't just for photos — art can be submitted straight in response
-- to an idea too, same as a photo can. Rounds out art's three possible
-- parents (a photo, another piece of art, or an idea); inspired_by,
-- inspired_by_art_id, and inspired_by_idea_id are mutually exclusive — at
-- most one is set, tracking exactly one parent (or none, for art posted on
-- its own).
alter table art add column if not exists inspired_by_idea_id uuid references ideas(id);
create index if not exists idx_art_inspired_by_idea on art(inspired_by_idea_id, created_at desc);
alter table art drop constraint if exists art_single_parent;
alter table art add constraint art_single_parent check (
  (case when inspired_by is not null then 1 else 0 end) +
  (case when inspired_by_art_id is not null then 1 else 0 end) +
  (case when inspired_by_idea_id is not null then 1 else 0 end) <= 1
);

-- Deleting a photo/art/idea must not break things that reference it — art
-- inspired by a deleted photo, or a photo taken from a deleted idea, has to
-- keep existing. So "delete" just flips status to 'deleted' instead of
-- removing the row; every listing query already filters to status = 'live',
-- so deleted rows vanish from feeds/lists for free, while a direct lookup
-- (e.g. an art piece resolving its source photo) still finds the row and
-- can render "removed" instead of erroring.
alter table photos drop constraint if exists photos_status_check;
alter table photos add constraint photos_status_check check (status in ('live', 'rejected', 'pending', 'deleted'));

alter table art drop constraint if exists art_status_check;
alter table art add constraint art_status_check check (status in ('live', 'rejected', 'pending', 'deleted'));

alter table ideas drop constraint if exists ideas_status_check;
alter table ideas add constraint ideas_status_check check (status in ('live', 'rejected', 'pending', 'deleted'));

-- One row per (photo, user) who loved it — the count is just
-- count(*) grouped by photo_id, no denormalized counter to keep in sync.
create table if not exists photo_loves (
  photo_id uuid not null references photos(id),
  user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  primary key (photo_id, user_id)
);
create index if not exists idx_photo_loves_photo on photo_loves(photo_id);

-- Friendship is stored as two rows (A->B and B->A) so "my friends" is
-- always a plain where user_id = $1 from either side, instead of an OR
-- across both columns everywhere it's queried.
create table if not exists friendships (
  user_id uuid not null references users(id),
  friend_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
create index if not exists idx_friendships_friend on friendships(friend_id);

-- Blocking is one-directional (me -> them) and intentionally separate from
-- friendships rather than a "status" column on the same table — a block
-- and a friendship are different relationships, not two states of one.
create table if not exists blocks (
  user_id uuid not null references users(id),
  blocked_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_id),
  check (user_id <> blocked_id)
);
create index if not exists idx_blocks_blocked on blocks(blocked_id);

-- Same shape as photo_loves — art can be loved too.
create table if not exists art_loves (
  art_id uuid not null references art(id),
  user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  primary key (art_id, user_id)
);
create index if not exists idx_art_loves_art on art_loves(art_id);

-- Weekly challenges were removed — drop what they left behind. Order
-- matters: the won_challenge_id columns reference challenges(id), so they
-- have to go before (or alongside, via cascade) the table itself.
alter table photos drop column if exists won_challenge_id;
alter table art drop column if exists won_challenge_id;
drop table if exists challenges cascade;
alter table users drop column if exists is_admin;

-- A user's self-set yearly targets for how many photos to take / pieces of
-- art to make. Either can be left unset. Progress is deliberately not
-- stored here — it's just a live count of that user's photos/art created
-- this calendar year (see goal.repository.ts), so it can never drift out
-- of sync with what's actually been posted.
create table if not exists goals (
  user_id uuid primary key references users(id),
  photo_goal integer check (photo_goal is null or photo_goal > 0),
  art_goal integer check (art_goal is null or art_goal > 0),
  updated_at timestamptz not null default now()
);

-- A photo someone has saved to work from offline ("Inzzpired" mode — see
-- PhotoWorkspace.jsx). Just a save marker: the actual image bytes for
-- offline use live in the browser's IndexedDB, not here. Ordered by
-- created_at so "continue working" on the profile shows the most recently
-- started piece first.
create table if not exists working_photos (
  user_id uuid not null references users(id),
  photo_id uuid not null references photos(id),
  created_at timestamptz not null default now(),
  primary key (user_id, photo_id)
);
create index if not exists idx_working_photos_user on working_photos(user_id, created_at desc);

-- The "vibe" of a user's profile museum room — now a single curated
-- room_theme (wall, floor, frame look, and plaque all bundled together as
-- one coordinated design) rather than separate wall/floor color pickers
-- and a per-piece frame style. max_pieces caps how many of the owner's
-- photos/art show on the wall at once (most recent first); null means show
-- everything. Keep this list in sync with ROOM_THEMES in the client's
-- roomThemes.js and ALLOWED_ROOM_THEMES in gallery.service.ts.
create table if not exists gallery_settings (
  user_id uuid primary key references users(id),
  updated_at timestamptz not null default now()
);
alter table gallery_settings drop column if exists frame_color;
alter table gallery_settings drop column if exists wall_color;
alter table gallery_settings drop column if exists floor_color;
alter table gallery_settings add column if not exists room_theme text not null default 'midnight-gallery'
  check (room_theme in ('midnight-gallery', 'sunlit-atelier', 'white-cube', 'salon-rouge'));
alter table gallery_settings add column if not exists max_pieces integer check (max_pieces is null or max_pieces > 0);
