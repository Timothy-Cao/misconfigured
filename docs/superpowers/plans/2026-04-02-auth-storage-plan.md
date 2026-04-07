# Misconfigured Auth and Storage Plan

> Deferred implementation plan for Google sign-in, account-backed map ownership, community publishing, and admin-managed campaign promotion.

## Goal

Add Google sign-in and account-backed persistence so players can:

- sign in with Google
- keep a personal cloud collection of levels they own
- publish up to 10 of their cloud levels to the public community at a time
- freely edit and delete their own published or unpublished cloud levels
- see author names attached to community maps

Also preserve the lightweight local editor workflow:

- local-only private maps remain available without login
- the browser can keep up to 20 local draft maps
- users can later move or recreate good drafts into their signed-in cloud collection

Campaign levels remain read-only for normal users. Only the admin account can promote community levels into campaign slots or directly edit campaign content.

## Current Recommendation

Use the simplest stack that matches the current Supabase direction:

- **Auth:** Supabase Auth with Google
- **Next integration:** `@supabase/ssr` with cookie-based sessions
- **Database:** existing Supabase Postgres
- **Authorization:** Row Level Security for owned community maps
- **Admin model:** allowlisted Google email address in environment variables

## Why This Direction

- The repo already depends on Supabase-backed API routes for community and campaign data.
- Using Supabase Auth avoids introducing a second auth system.
- Ownership rules map naturally onto Supabase auth identities and Postgres RLS.
- This replaces the current shared-password model with real per-user ownership.
- It leaves room for later features like likes, moderation, map history, or admin tooling.

## Product Model

### Public / signed-out

- Can play campaign.
- Can browse and play published community levels.
- Can use the editor locally.
- Can save up to 20 local-only draft maps in the browser.
- Cannot save cloud maps.
- Cannot publish to community.

### Signed-in

- Can save cloud-owned maps.
- Can load and edit only their own cloud maps.
- Can publish or unpublish their own cloud maps.
- Can have at most 10 published community maps at one time.
- Can delete their own cloud maps freely.

### Admin

- Can do everything a normal signed-in user can do.
- Can promote a community map into a campaign slot.
- Can edit campaign levels directly.
- Campaign content is otherwise read-only.

## Non-Goals For V1

- multiple auth providers
- usernames or profile pages
- comments, likes, ratings, favorites
- collaborative editing
- version history
- moderation workflows beyond admin promotion

## Data Model

### `profiles`

- `id uuid primary key references auth.users(id)`
- `email text unique not null`
- `display_name text`
- `avatar_url text`
- `is_admin boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `community_levels`

- `id bigint primary key generated always as identity`
- `owner_id uuid not null references profiles(id)`
- `name text not null`
- `width integer not null`
- `height integer not null`
- `grid jsonb not null`
- `players jsonb not null`
- `lives integer not null default 1`
- `max_moves integer null`
- `is_published boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `campaign_overrides`

Keep the current table, but add optional provenance:

- `source_community_level_id bigint null references community_levels(id)`
- existing payload columns remain

## Ownership Rules

- Published community levels are readable by everyone.
- Unpublished cloud levels are readable only by their owner.
- A signed-in user can insert only rows where `owner_id = auth.uid()`.
- A signed-in user can update/delete only their own rows.
- A user can publish a level only if they currently have fewer than 10 published levels.
- Campaign writes are admin-only.

## Local vs Cloud Storage

### Local drafts

- Continue using localStorage.
- Cap at 20 maps.
- Treated as private scratch space.
- No account required.

### Cloud maps

- Stored in Supabase under the signed-in user.
- Editable and deletable only by the owner.
- Publishing is a toggle on a cloud-owned map.

This means private storage is split intentionally:

- local drafts = quick, disposable, offline-friendly
- cloud maps = owned, portable, publishable

## Pages and UX

### Authentication

- Add `Sign in with Google` to the title screen and relevant headers.
- Add signed-in user chip with avatar/name and sign-out.
- If a signed-out user tries to use cloud save/publish, prompt sign-in.

### Editor

- Keep local editing as the default frictionless workflow.
- Remove password inputs for community/admin flows once auth is live.
- Add actions such as:
  - `Save Local Draft`
  - `Save to My Cloud Maps`
  - `Update Cloud Map`
  - `Publish`
  - `Unpublish`
- Show admin-only controls for campaign promotion/editing.

### My Maps Page

Add a dedicated page, likely `/my-maps`, that shows the signed-in user's cloud collection.

Each card should show:

- map name
- publication status
- last updated time
- play button
- edit button
- publish / unpublish toggle
- delete button

Important behavior:

- the user can launch a map from `My Maps` and play it exactly like any other level
- cloud-owned unpublished maps should be playable by the owner from this page
- published maps remain playable from both `My Maps` and Community

### Community Page

- Show only published community levels.
- Show author name on each level card.
- Show owner actions only for the signed-in owner.
- Remove the shared community password flow.

## Route / API Responsibilities

Implement authenticated server routes or server actions for:

- sign-in callback and profile upsert
- get current session/user
- list my cloud maps
- create cloud map
- update cloud map
- delete cloud map
- publish cloud map
- unpublish cloud map
- list public community maps
- promote community map to campaign (admin)
- save campaign override (admin)

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`
- Google provider configuration in Supabase dashboard
- app redirect URLs for local + deployed environments

## Row Level Security Plan

Enable RLS on `community_levels` and `profiles`.

Core policies:

- `profiles`
  - everyone can read minimal public profile info if needed
  - users can insert/update only their own profile row
- `community_levels`
  - `select` published rows for everyone
  - `select` all owned rows for owner
  - `insert` only when `owner_id = auth.uid()`
  - `update/delete` only when `owner_id = auth.uid()`

The published-map cap of 5 should be enforced in server code first.

## Rollout Steps

### Phase 1: Supabase Auth Foundation

- [ ] Install `@supabase/supabase-js` and `@supabase/ssr`
- [ ] Add browser/server Supabase client helpers
- [ ] Add auth middleware / session refresh path
- [ ] Configure Google login in Supabase
- [ ] Add sign-in/sign-out UI
- [ ] Create `profiles` table and user upsert flow
- [ ] Mark admin account from `ADMIN_EMAILS`

### Phase 2: Cloud-Owned Community Maps

- [ ] Add `owner_id` and `is_published` support to `community_levels`
- [ ] Add RLS policies
- [ ] Replace password-based community save/delete APIs
- [ ] Add authenticated create/update/delete handlers
- [ ] Add server-side published count check (`<= 5`)

### Phase 3: My Maps and Editor Integration

- [ ] Add `/my-maps`
- [ ] Add cloud map list for current user
- [ ] Add play/edit/delete/publish controls on `My Maps`
- [ ] Add editor actions for cloud save/update
- [ ] Keep local draft flow and add 20-map local cap

### Phase 4: Community and Campaign Admin

- [ ] Update community page to show public published maps only
- [ ] Show author names
- [ ] Remove shared community password UX
- [ ] Add admin-only promote-to-campaign action
- [ ] Add optional provenance link from campaign override to source community map

## Migration Notes

- Keep local draft support during the entire rollout.
- Remove `src/lib/admin.ts` from normal community workflows once auth is live.
- Keep the current password-protected campaign/admin flow only until admin auth is ready.
- After rollout, community CRUD should rely on ownership, not shared secrets.

## Open Questions

- Should cloud-owned unpublished maps have a hard total cap, or remain effectively unlimited for now?
- Should promoted campaign levels preserve a visible author credit from the source community map?
- Should `My Maps` include both local drafts and cloud maps on one page, or should local drafts stay editor-only?

## Current Recommended Answers

- Cloud unpublished maps: no hard cap for now
- Campaign promotion: store source map provenance, attribution optional in UI
- `My Maps`: cloud maps page only; keep local drafts inside the editor for v1
