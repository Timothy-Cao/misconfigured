# Misconfigured - Level Design Document

## Design Philosophy

Each level should teach **one new idea**, then the following 1-2 levels reinforce and
combine it with prior mechanics before the next idea is introduced. Player count starts
at 2 and grows to 4 as complexity increases. The goal is that a player who beats level N
has all the vocabulary they need for level N+1.

Notation used below:
- **Players**: number of players in the level (2, 3, or 4)
- **Grid**: approximate grid size (WxH)
- **New tile(s)**: the tile type(s) being introduced
- **Concept**: what the player should learn

---

## World 1: Foundations (Levels 1-6)

### Level 1 — "First Steps"
- **Players**: 2 (Orange 0deg, Blue 180deg)
- **Grid**: 8x6
- **New tiles**: Floor, Void, Goal
- **Concept**: Pressing W moves one player up and the other down.
- **Layout**: Two small rooms side by side, each with a goal. A single horizontal
  corridor connects them. Orange starts top-left, Blue starts bottom-right. Pressing W
  once moves Orange toward the top goal and Blue toward the bottom goal. The solve is
  just a few presses of W — pure "aha, they move opposite."
- **Solution**: W x3-4. One direction input solves it.

### Level 2 — "Crossroads"
- **Players**: 2 (Orange 0deg, Cyan 90deg)
- **Grid**: 8x8
- **New tiles**: (none)
- **Concept**: Orthogonal rotations — W moves one up and the other right.
- **Layout**: Plus-shaped open room. Orange starts left, goal at top. Cyan starts
  bottom, goal at right. Player must combine W and D inputs. The trick: inputs that
  help one player are perpendicular for the other. A few walls force a specific
  2-3 move sequence.
- **Solution**: W then D (or similar short sequence). Teaches that you need to think
  about *both* players per keypress.

### Level 3 — "Four Corners"
- **Players**: 4 (all rotations)
- **Grid**: 10x10
- **New tiles**: (none)
- **Concept**: Introduction to 4-player control. All four rotations at once.
- **Layout**: Large open room with goals in four corners. Players start near center
  in a cluster. One input sends each player to a different corner. The puzzle is nearly
  trivial but lets the player *see* the four-way split for the first time.
- **Solution**: W, then maybe one corrective input. Very easy.

### Level 4 — "Corridors"
- **Players**: 2 (Orange 0deg, Blue 180deg)
- **Grid**: 10x8
- **New tiles**: (none — walls used more aggressively)
- **Concept**: Using walls to your advantage. One player hits a wall and stops while
  the other keeps moving.
- **Layout**: Two interleaved zigzag corridors. Orange's corridor goes up-right,
  Blue's goes down-left. Key insight: when one player hits a wall dead-end, only the
  other moves, allowing independent positioning. The player must "park" one player
  against a wall to move the other alone.
- **Solution**: ~6-8 inputs. First real puzzle-thinking required.

### Level 5 — "Don't Touch"
- **Players**: 2 (Orange 0deg, Cyan 90deg)
- **Grid**: 8x8
- **New tiles**: Kill Zone
- **Concept**: Hazards punish careless movement. You must plan paths that avoid kill
  zones for *all* players simultaneously.
- **Layout**: Open room with kill zone strips. Orange has a clear path to goal, but
  the inputs that move Orange there would push Cyan through a kill zone (and vice versa).
  Player must find a safe interleaving.
- **Solution**: ~5-6 inputs. One wrong move kills a player. No checkpoints yet — forced
  restart on death teaches caution.

### Level 6 — "Safety Net"
- **Players**: 3 (Orange 0deg, Cyan 90deg, Blue 180deg)
- **Grid**: 10x10
- **New tiles**: Checkpoint
- **Concept**: Checkpoints save progress. Death isn't full restart anymore.
- **Layout**: Three-lane level (one per player) with kill zones scattered throughout.
  A checkpoint halfway through each lane. First half is easy, second half is harder.
  Dying after the checkpoint respawns you there, not at start.
- **Solution**: ~8-10 inputs. Player learns the relief of checkpoints and that death
  only costs partial progress.

---

## World 2: Interaction (Levels 7-12)

### Level 7 — "Heavy Lifting"
- **Players**: 2 (Orange 0deg, Blue 180deg)
- **Grid**: 8x8
- **New tiles**: Pushable Block
- **Concept**: Blocks can be pushed and they're affected by the same "opposite movement"
  problem.
- **Layout**: One block sits between Orange and a wall. Orange needs to push it out of
  the way to reach the goal. Blue's path is clear. The catch: moving Orange toward the
  block also moves Blue, so Blue must not end up in trouble. A simple wall pocket keeps
  Blue safe.
- **Solution**: ~4-5 inputs. Teaches block pushing basics.

### Level 8 — "Open Sesame"
- **Players**: 2 (Orange 0deg, Cyan 90deg)
- **Grid**: 10x8
- **New tiles**: Pressure Plate (1), Door (1)
- **Concept**: Stand on a plate to open a door. But you can't stand on the plate AND
  walk through the door with the same player.
- **Layout**: Two rooms separated by Door 1. Plate 1 is in Room A. Orange starts in
  Room A, Cyan starts in Room A too but on the other side. Orange must stand on the plate
  while Cyan walks through the door. Since their inputs are perpendicular, the player
  must figure out how to get Orange onto the plate and then move Cyan through without
  Orange stepping off.
- **Solution**: ~5-7 inputs. "Park" Orange on plate using a wall, then input that moves
  Cyan through the door while Orange is blocked.

### Level 9 — "Plate and Block"
- **Players**: 2 (Orange 0deg, Blue 180deg)
- **Grid**: 10x8
- **New tiles**: (none — combines Pushable + Pressure Plate)
- **Concept**: Push a block onto a pressure plate to hold a door open permanently.
- **Layout**: Block near Plate 1. Door 1 blocks the path to both goals. Player pushes
  block onto plate (opening door), then both players walk through. A wall prevents the
  block from being pushed past the plate.
- **Solution**: ~6-8 inputs. Solidifies block + plate interaction.

### Level 10 — "Fork in the Road"
- **Players**: 3 (Orange 0deg, Cyan 90deg, Purple 270deg)
- **Grid**: 12x10
- **New tiles**: (none — first 3-player puzzle with plates/doors)
- **Concept**: Multi-plate coordination. Two doors, two plates, three players.
- **Layout**: Three branching paths from a central hub. Two paths end at doors that
  require plates held by the other players. Third path has a block to push. One player
  holds plate 1, another holds plate 2, third walks through both doors to reach the
  goals area, then the plate-holders have alternate routes to their goals.
- **Solution**: ~10-12 inputs. First level requiring real multi-step planning.

### Level 11 — "Through the Gate"
- **Players**: 2 (Orange 0deg, Blue 180deg)
- **Grid**: 8x8
- **New tiles**: One-Way Tile
- **Concept**: One-way tiles allow passage in only one direction — a player can enter
  from one side but not return.
- **Layout**: A loop with one-way tiles forcing clockwise movement. Orange and Blue need
  to navigate the loop to reach goals on opposite sides. The one-ways prevent
  backtracking, so the player must commit to a direction. Since Orange and Blue move
  opposite, one naturally goes clockwise while the other goes counter — but only
  clockwise works. Player must use walls to redirect.
- **Solution**: ~6-8 inputs. Teaches commitment and path planning.

### Level 12 — "Assembly Line"
- **Players**: 3 (Orange 0deg, Cyan 90deg, Blue 180deg)
- **Grid**: 12x8
- **New tiles**: Conveyor Belt
- **Concept**: Conveyors push players in a fixed direction. Combined with rotated
  controls, some players get helped while others fight the current.
- **Layout**: Three parallel lanes with rightward conveyors. Goals are on the left side.
  Cyan (whose W = right) gets pushed further right by conveyors. Orange and Blue must
  fight against or use the conveyor. A few safe alcoves (no conveyor) let players "rest."
  The solve requires ducking into alcoves at the right time.
- **Solution**: ~8-10 inputs. Teaches that conveyors affect all players equally but
  interact differently with each player's rotation.

---

## World 3: Terrain (Levels 13-18)

### Level 13 — "Black Ice"
- **Players**: 2 (Orange 0deg, Cyan 90deg)
- **Grid**: 10x8
- **New tiles**: Ice
- **Concept**: Ice tiles cause sliding — once on ice, you keep moving until hitting
  a wall or non-ice tile.
- **Layout**: A room with an ice patch in the center. Goals are across the ice.
  Orange slides up on ice (toward goal), but Cyan slides right (into a wall, not toward
  goal). Player must find a path where ice sliding benefits (or at least doesn't harm)
  both players. Small floor "islands" in the ice act as stopping points.
- **Solution**: ~5-7 inputs. The ice fundamentally changes how you plan — you think in
  terms of "where will sliding stop?" rather than "one tile at a time."

### Level 14 — "Slip and Slide"
- **Players**: 3 (Orange 0deg, Cyan 90deg, Blue 180deg)
- **Grid**: 12x10
- **New tiles**: (none — ice + walls puzzle)
- **Concept**: Using walls as ice brakes. Strategic wall placement matters.
- **Layout**: Large ice arena with scattered wall pillars. Goals are in three alcoves.
  Players must slide between pillars, using them to stop at specific positions. The
  challenge is that the same slide sends three players in three directions — pillar
  placement means different players stop at different points.
- **Solution**: ~8-10 inputs. Requires visualizing multiple slide paths at once.

### Level 15 — "Muddy Waters"
- **Players**: 2 (Orange 0deg, Blue 180deg)
- **Grid**: 8x8
- **New tiles**: Mud
- **Concept**: Mud slows movement. When one player is on mud, the other (on floor)
  moves faster/further per input hold, creating desynchronization.
- **Layout**: Two paths to two goals. One path goes through mud, the other through
  floor. Orange takes the mud path, Blue takes the floor path. The speed difference
  means you can hold an input longer to move Blue far while Orange barely moves —
  useful for positioning them independently.
- **Solution**: ~4-5 inputs but with precise hold durations. First level where
  *how long* you hold a key matters, not just which key.

### Level 16 — "Crumbling Path"
- **Players**: 2 (Orange 0deg, Cyan 90deg)
- **Grid**: 10x8
- **New tiles**: Crumble
- **Concept**: Crumble tiles break after being stepped on once, becoming void. You
  cannot retrace your steps.
- **Layout**: A grid of crumble tiles forming a path. Orange and Cyan start on opposite
  ends. Each step destroys the tile behind you. If you make a wrong move, you may
  strand a player with no path to the goal. Limited floor tiles at key junctions give
  safe resting spots.
- **Solution**: ~6-8 inputs. Requires full path planning before the first move.
  Very puzzle-heavy.

### Level 17 — "Crumble and Commit"
- **Players**: 3 (Orange 0deg, Cyan 90deg, Purple 270deg)
- **Grid**: 12x10
- **New tiles**: (none — crumble + one-way combo)
- **Concept**: Crumble tiles combined with one-way tiles create irreversible funnels.
- **Layout**: A maze with branching crumble paths and one-way gates at intersections.
  Each player must choose a branch (implicitly, via the shared input). Wrong branches
  dead-end with crumbled tiles behind you. The correct branch sequence has one-way tiles
  confirming "you're going the right way" — once through, no going back.
- **Solution**: ~10-12 inputs. Requires careful planning. Possibly the first level
  players will want to restart a few times.

### Level 18 — "Terrain Gauntlet"
- **Players**: 4 (all rotations)
- **Grid**: 14x10
- **New tiles**: (none — combines ice, mud, crumble, conveyors)
- **Concept**: All terrain types in one level. Each player's path has different terrain.
- **Layout**: Four parallel-ish paths (one per player) from left to right. Each path
  features a different terrain: one icy, one muddy, one crumbling, one with conveyors.
  The shared input must navigate all four simultaneously. Key insight: ice overshoots,
  mud undershoots, crumble limits attempts, conveyors redirect. The player must balance
  all four constraints.
- **Solution**: ~12-15 inputs. A gauntlet-style consolidation level.

---

## World 4: Warp and Switch (Levels 19-22)

### Level 19 — "Warp Zone"
- **Players**: 2 (Orange 0deg, Blue 180deg)
- **Grid**: 10x10
- **New tiles**: Teleporter (pair 1)
- **Concept**: Teleporters move you from point A to point B after briefly standing on
  them (charge time ~1 second).
- **Layout**: Two rooms separated by void (no walking path). Each room has a teleporter
  pad — Teleporter 1A in room 1, Teleporter 1B in room 2. Orange starts in room 1 near
  a goal but needs to reach room 2's goal. Blue is opposite. They each teleport to the
  other room. The charge time means you must stay still on the pad, which means the
  *other* player must also be stationary (against a wall or on their own teleporter).
- **Solution**: ~5-6 inputs + a hold. Introduces teleport timing.

### Level 20 — "Warp Maze"
- **Players**: 3 (Orange 0deg, Cyan 90deg, Blue 180deg)
- **Grid**: 12x12
- **New tiles**: Teleporter (pairs 1-3)
- **Concept**: Multiple teleporter pairs create a network. Choosing which teleporter
  to use (and in what order) is the puzzle.
- **Layout**: A grid of small rooms connected only by teleporter pairs. Each room has
  1-2 teleporter pads. Players start in different rooms and must navigate the teleporter
  network to reach a central goal room. The trick: teleporting one player while another
  is mid-charge cancels the charge (because of shared input — you must move to reach the
  next teleporter, which disrupts the stationary player).
- **Solution**: ~10-14 inputs. Requires sequencing teleports carefully.

### Level 21 — "Flip Switch"
- **Players**: 2 (Orange 0deg, Cyan 90deg)
- **Grid**: 10x8
- **New tiles**: Toggle Switch (1), Toggle Block (1)
- **Concept**: Toggle switches flip toggle blocks between solid and passable. Each
  step on the switch flips the state.
- **Layout**: Toggle Block 1 walls off the goal area. Toggle Switch 1 is accessible
  but positioned so that walking to the switch with one player inadvertently moves the
  other into a dead end. Player must toggle the switch, then navigate through before
  toggling it again by accident.
- **Solution**: ~6-8 inputs. Teaches toggle state awareness.

### Level 22 — "Double Toggle"
- **Players**: 3 (Orange 0deg, Cyan 90deg, Blue 180deg)
- **Grid**: 12x10
- **New tiles**: Toggle Switch (1-2), Toggle Block (1-2)
- **Concept**: Two independent toggle circuits. Toggling one might block a path you
  need for the other.
- **Layout**: Two overlapping toggle systems. Toggle blocks 1 guard one goal, toggle
  blocks 2 guard another. A switch for system 1 is past toggle blocks 2 (and vice
  versa). Players must alternate which toggle system is open, threading through gaps.
  One player can "sacrifice" position to hold a switch while others pass.
- **Solution**: ~10-12 inputs. Multi-state management.

---

## World 5: Reconfigured (Levels 23-25)

### Level 23 — "Spin Cycle"
- **Players**: 2 (Orange 0deg, Cyan 90deg)
- **Grid**: 10x10
- **New tiles**: Rotation Tile (CW, CCW)
- **Concept**: Rotation tiles change a player's control rotation mid-level. This is
  the game's thematic climax — the "misconfiguration" itself becomes mutable.
- **Layout**: A loop path with CW rotation tiles at each corner. Orange starts as 0deg
  (W=up). After stepping on a CW tile, Orange becomes 90deg (W=right) — now Orange
  and Cyan have the SAME rotation. This means they move the same direction, which is
  both useful (synchronized) and limiting (can't separate them). A CCW tile later
  restores the offset. The puzzle requires rotating at the right time to align or
  misalign players as needed.
- **Solution**: ~8-10 inputs. A brain-melting "rotation of rotations" puzzle.

### Level 24 — "Reverse Polarity"
- **Players**: 3 (Orange 0deg, Cyan 90deg, Purple 270deg)
- **Grid**: 12x10
- **New tiles**: Reverse Tile
- **Concept**: Reverse tiles flip a player's left/right axis — W still maps to
  their rotation's direction, but A and D swap. Combined with rotation, this creates
  a mirror-image movement pattern.
- **Layout**: Symmetric level with reverse tiles on one half. When Orange crosses to
  the reversed half, their A/D swap. Other players on the normal side are unaffected.
  The puzzle requires moving a player into reversed territory to reach a goal that's
  only accessible via mirrored input, while keeping the other players safe in normal
  territory.
- **Solution**: ~10-12 inputs. Requires mental tracking of reversed state.

### Level 25 — "Misconfigured"
- **Players**: 4 (all rotations)
- **Grid**: 14x14
- **New tiles**: (none — grand finale using everything)
- **Concept**: The ultimate combination puzzle. Uses a curated subset of all
  previously introduced mechanics.
- **Layout**: Four quadrants, each with a different theme:
  - **NW Quadrant (Ice + Teleporters)**: Slide across ice to reach a teleporter that
    warps you to the goal area.
  - **NE Quadrant (Conveyors + One-Ways)**: Navigate a conveyor maze with one-way
    gates that funnel you toward (or away from) the goal.
  - **SW Quadrant (Crumble + Toggles)**: Limited-step crumble path with toggle blocks
    that open/close based on switches in other quadrants.
  - **SE Quadrant (Plates + Doors + Pushable)**: Classic block-on-plate puzzle to
    unlock the final door.
  - **Central hub**: Rotation tiles that let players swap quadrant assignments if
    they realize their current quadrant is wrong for their rotation.
- The four players start in the center and must each find the quadrant that works with
  their rotation. Some quadrants are only solvable by specific rotations. Kill zones
  with checkpoints add stakes without being punishing.
- **Solution**: ~20-30 inputs. Multi-phase puzzle. The satisfying "click" is realizing
  which player belongs in which quadrant.

---

## General Design Notes

### Player Count Progression
| Levels | Players | Rationale |
|--------|---------|-----------|
| 1-2    | 2       | Learn the core rotation mechanic with minimal complexity |
| 3      | 4       | One-time "wow" introduction, but trivially easy |
| 4-5    | 2       | Back to 2 for learning walls and kill zones |
| 6, 10, 12, 17 | 3 | Bridge to 4 — complex enough for plates/doors, less overwhelming |
| 18, 25 | 4       | Gauntlet and finale — full roster |
| Others | 2       | Default to 2 when introducing a new tile type |

### Difficulty Curve
- **Levels 1-3**: Tutorial. Any input sequence basically works. ~30 seconds each.
- **Levels 4-6**: Gentle puzzles. 1-3 "aha" moments. ~1-2 minutes each.
- **Levels 7-12**: Real puzzles. Require planning 3-5 moves ahead. ~2-4 minutes.
- **Levels 13-18**: Hard. Terrain mechanics demand mental simulation. ~3-5 minutes.
- **Levels 19-22**: Advanced. State management (teleport charges, toggle states). ~4-6 min.
- **Levels 23-25**: Expert. Rotation changes rewrite the rules you've internalized. ~5-10 min.

### Wall Parking Principle
The most important puzzle technique in this game is **wall parking**: moving one player
against a wall so they stop, allowing subsequent inputs to only affect the other
player(s). Every level from 4 onward should have walls positioned to enable this.
Levels should be designed so the player discovers this technique naturally by level 4
and relies on it throughout.

### Kill Zone Philosophy
Kill zones should be **threatening but fair**. Every kill zone near a player's path
should have a checkpoint within 2-3 moves prior. Kill zones should never feel like
"gotchas" — the player should be able to see the danger and plan around it. Exception:
level 25 (finale) can be more punishing since the player is experienced.

### Technical Note: Player Count
The current `LevelData` interface requires exactly 4 `PlayerStart` entries. To support
2-3 players, the engine will need either:
1. A `playerCount` field with unused players spawned off-map or removed, or
2. Changing the `players` tuple to a variable-length array (`PlayerStart[]`)

Option 2 is cleaner. The engine loop, renderer, and win-condition check all iterate
over the players array, so a variable-length array should work with minimal changes.
The HUD's 4-dot goal indicator would need to be dynamic as well.
