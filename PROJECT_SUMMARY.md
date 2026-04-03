# Misconfigured Project Summary

## Technical Summary

Misconfigured is a web-based puzzle game built with:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- HTML5 Canvas for gameplay rendering
- Vitest for test coverage

The project is split into a few clear layers:

- `src/app/`
  - route entry points for home, campaign levels, gameplay, editor, community, and API endpoints
- `src/components/`
  - React UI wrappers and overlays such as the game canvas mount, HUD, level select, and editor
- `src/engine/`
  - core gameplay logic, movement rules, collision checks, tile behaviors, and canvas rendering
- `src/levels/`
  - built-in campaign and bundled community level data
- `src/lib/`
  - persistence and integration helpers, including admin/community/campaign API helpers and Supabase-related utilities
- `docs/`
  - implementation notes, design plans, and supporting project docs

Architecturally, React handles menus, routing, overlays, and editor UI, while the game simulation itself lives in a separate engine layer. That engine is responsible for:

- unit movement and identity remapping
- tile effects and interactions
- win/loss conditions
- animation state
- canvas drawing

The current gameplay model supports one or more controllable units per level rather than a fixed 1-4 player limit. A level completes when every active unit is settled by either:

- locking onto a green goal tile
- being absorbed by a green black hole

Current persistence is mixed:

- local progress and editor state still exist in client-side storage paths
- newer community/campaign work has API routes and Supabase-oriented helpers for remote persistence

## Design Summary

Misconfigured is a simultaneous-control puzzle game. One input moves all active units at once, but each unit may interpret that input differently based on its current identity and facing. The main challenge is not dexterity, but planning around conflicting motion, timing, and state changes.

The visual and mechanic direction is:

- minimal, readable, grid-based rooms
- strong tile language where each mechanic has a distinct visual identity
- short input sequences that create surprising multi-unit outcomes
- puzzle designs that reward understanding shared control rather than raw execution

The current mechanic set includes:

- goals and black holes as finish states
- kill zones and checkpoints
- push blocks
- pressure plates and doors
- toggles
- conveyors
- directional path tiles
- rotation tiles
- reverse tiles
- crumble, mud, ice, and life pickups
- repaint stations, color filters, and sticky pads

The design trend of the game is toward systems that change unit identity, movement interpretation, or temporary coordination windows. Recent changes especially push the game toward:

- more flexible unit counts
- future clone-like or multi-body mechanics
- identity-based puzzle logic
- stronger support for user-created and community-shared levels

In short, the project is a puzzle engine first, a campaign second, and increasingly a level-creation platform as well.
