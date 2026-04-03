# Misconfigured Auth and Storage Plan

> Deferred implementation plan for account-backed level saving, community publishing, and admin-managed campaign editing.

## Goal

Add Google sign-in and account-backed persistence so players can:

- save draft levels to their own account
- load their own saved levels in the editor
- publish levels to the community without using the current client-side admin password flow
- associate display names with published levels

Also add admin-only campaign editing for the project owner account.

## Current Recommendation

Use the simplest expandable stack:

- **Auth:** Auth.js with Google provider
- **Database:** Postgres hosted through a Vercel Marketplace provider
- **Session strategy:** JWT sessions at first
- **Admin model:** allowlisted Google email address in environment variables

## Why This Direction

- The main app data is relational: users, owned levels, published levels, campaign slots, admin rights.
- This fits Postgres much better than Redis as a primary datastore.
- Redis can still be added later for caching, rate limits, or transient state, but should not be the source of truth for users or levels.
- This keeps the v1 implementation small while leaving room for moderation, quotas, likes, or level history later.

## Non-Goals For V1

- multiple auth providers
- username claiming
- moderation queue
- level version history
- comments, ratings, favorites, or social features
- collaborative editing

## V1 Product Rules

- Unauthenticated users can play the campaign.
- Community browsing can remain public or become account-only; decide at implementation time.
- Authenticated users can save private draft levels to their own account.
- Authenticated users can publish their own levels to the community.
- Authenticated users can edit and unpublish only their own levels.
- Only the allowlisted admin account can create or edit campaign levels.
- The old client-side password gate should be removed once this system is live.

## Suggested Schema

### `users`

- `id` UUID primary key
- `google_sub` text unique not null
- `email` text unique not null
- `name` text
- `image_url` text
- `is_admin` boolean not null default false
- `level_limit_override` integer nullable
- `created_at` timestamp not null
- `updated_at` timestamp not null

### `levels`

- `id` UUID primary key
- `owner_user_id` UUID not null references `users(id)`
- `title` text not null
- `content_json` jsonb not null
- `is_published` boolean not null default false
- `is_campaign` boolean not null default false
- `campaign_slot` integer nullable
- `created_at` timestamp not null
- `updated_at` timestamp not null
- `published_at` timestamp nullable

### Optional later columns

- `thumbnail_url`
- `description`
- `slug`
- `deleted_at`

## Ownership Rules

- A user can read and update only their own non-campaign levels.
- A user can publish and unpublish only their own non-campaign levels.
- Admin can create and edit campaign levels.
- Campaign levels should be unique by `campaign_slot`.
- If a player map cap is added, enforce it on the server, not only in the UI.

## Environment Variables

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `ADMIN_EMAILS`
- `DATABASE_URL`

## App Changes

### Authentication

- Add sign-in / sign-out controls to the title screen or header.
- Show the signed-in user name and avatar in the editor/community views.
- Redirect or prompt when a user tries to save or publish without signing in.

### Level Editor

- Replace the current password input and publish flow.
- Add "Save Draft" for the current user.
- Add "My Levels" load panel.
- Add "Publish to Community" and "Unpublish" actions for the owner.
- Show campaign editing controls only for admin.

### Community

- Show author name on each community level card.
- Filter community list to published non-campaign levels.
- Add optional "My Levels" section later if useful.

## Server Responsibilities

Create server-side actions or route handlers for:

- sign-in callbacks and user upsert
- create level
- update level
- load current user's levels
- publish level
- unpublish level
- create or update campaign level
- list community levels

Sensitive checks must happen on the server:

- ownership
- admin rights
- publish permissions
- map-count limits

## Rollout Steps

### Phase 1: Database and Auth

- [ ] Choose the Postgres provider in Vercel Marketplace
- [ ] Add environment variables
- [ ] Install Auth.js and database tooling
- [ ] Create initial schema and migrations
- [ ] Implement Google sign-in
- [ ] Upsert user records on sign-in
- [ ] Mark admin account from `ADMIN_EMAILS`

### Phase 2: User Level Persistence

- [ ] Add authenticated draft save endpoint/action
- [ ] Add authenticated "load my levels" query
- [ ] Save and load editor levels from Postgres instead of only localStorage
- [ ] Preserve local editor UX while replacing the password gate

### Phase 3: Community Publishing

- [ ] Add publish/unpublish actions
- [ ] Add community list query from published levels
- [ ] Show author names in the community UI
- [ ] Remove the old local-only community publishing assumptions

### Phase 4: Admin Campaign Editing

- [ ] Add admin-only campaign save path
- [ ] Map campaign records to built-in campaign slots
- [ ] Ensure non-admin users cannot write campaign records

## Migration Notes

- Keep current localStorage level support during the transition if useful for testing.
- Do not delete the current local editor flow until account-backed save/load is working.
- After rollout, deprecate `src/lib/admin.ts` and the client-side password publishing flow.

## Open Decisions

- Should community browsing require login, or only publishing?
- Should account-backed drafts replace localStorage entirely, or coexist as a fallback?
- Should the first version cap stored non-campaign levels per user, or wait?
- Should campaign levels live in the same table as user levels, or move to a dedicated campaign table later?

## Recommended Answer To The Open Decisions

- Community browsing: public, publishing requires login.
- Draft storage: keep localStorage only as temporary import/export fallback.
- Level cap: defer until needed, but add the schema field now.
- Campaign storage: same table for v1, split later only if complexity grows.
