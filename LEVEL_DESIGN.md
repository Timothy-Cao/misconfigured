# Misconfigured - Early Level Design

## Tutorial Principles

The opening of the game is now built around two updated rules:

- Levels may use **1 to 4 players**.
- A **black hole** is a valid finish tile. A player absorbed by a black hole counts as completed, just like a player locked onto a goal.

The first ten levels are intentionally narrow in scope. Each one teaches one concrete idea with a low move count and limited visual noise.

Rules for the opening set:

- Prefer **1 or 2 players** unless the mechanic specifically benefits from more.
- Use **small boards** with one obvious active area.
- Teach with **one safe sequence**, not with broad open maps.
- Avoid medium or hard combinations for now.
- Introduce a mechanic in a pure form before combining it with earlier ones.

## Opening Arc

### Level 1 - First Step

- Players: 1
- Mechanic: basic movement to a goal
- Board: open vertical room
- Goal: teach that one key press equals one grid step
- Intended solve: `W` repeated
- Design note: this is the only level that should feel almost toy-like

### Level 2 - Opposite Ends

- Players: 2
- Mechanic: opposite movement
- Board: open room with one goal near the top and one near the bottom
- Goal: teach that one input affects both players differently
- Intended solve: repeated `W`
- Design note: both players should succeed from the same repeated input so the concept lands immediately

### Level 3 - Cross Input

- Players: 2
- Mechanic: perpendicular movement from rotated players
- Board: open room with offset goals
- Goal: teach that the player must now think in input-space, not in per-character movement
- Intended solve: `W`, then `D`
- Design note: this is the first level that should require more than one input direction

### Level 4 - Parking Spot

- Players: 2
- Mechanic: using walls to pin one player while the other keeps moving
- Board: two disconnected corridors
- Goal: teach that walls create temporary independence
- Intended solve: move the vertical player onto a goal first, then finish the horizontal player
- Design note: goal-locking is useful here because one solved player naturally stops participating

### Level 5 - Into the Hole

- Players: 1
- Mechanic: black hole finish
- Board: single straight lane
- Goal: teach that black holes are intentional exits, not hazards
- Intended solve: repeated `W`
- Design note: no normal goals should appear in this level

### Level 6 - Split Finish

- Players: 2
- Mechanic: one player finishes on a goal, the other in a black hole
- Board: open room with two different finish targets
- Goal: teach that completion can mix finish types
- Intended solve: `W`, then `D`
- Design note: this should feel like the black-hole counterpart to Level 3

### Level 7 - Do Not Step There

- Players: 1
- Mechanic: kill tile
- Board: open room with one obvious dangerous tile in the direct path
- Goal: teach rerouting around a hazard
- Intended solve: sidestep, move past, sidestep back
- Design note: the kill tile should be visible early and centered in the obvious route

### Level 8 - Safe Progress

- Players: 1
- Mechanic: checkpoint
- Board: short route with checkpoint in the middle and danger near the end
- Goal: teach that progress can be banked before a risky section
- Intended solve: touch checkpoint, then finish
- Design note: the checkpoint should be unavoidable so the player learns it by contact

### Level 9 - Push It Up

- Players: 1
- Mechanic: pushable block
- Board: short corridor with a block and an escape lane
- Goal: teach that the block can be shoved out of the route
- Intended solve: push once, then walk around to the goal
- Design note: do not combine this with pressure plates yet

### Level 10 - Open Sesame

- Players: 2
- Mechanic: pressure plate and door
- Board: one player reaches a plate while the other crosses a door
- Goal: teach timing between multiple characters
- Intended solve: first input places the plate-holder, second opens the route, third finishes
- Design note: the door should not be passable on the same input that first activates the plate

## Exact Implementation Notes

These are the concrete targets for the first ten implemented levels.

### Level 1

- Use one orange player facing up.
- Place the player at the bottom center.
- Place one goal at the top center.
- Keep the room open.

### Level 2

- Use one orange player facing up and one blue player facing down.
- Put the orange goal above its start and the blue goal below its start.
- Make `W` repeatedly solve both.

### Level 3

- Use one orange player facing up and one cyan player facing right.
- Offset the two finish tiles so the solve is `W`, then `D`.
- Keep the room open so only rotation is being taught.

### Level 4

- Give orange a horizontal top corridor.
- Give blue a separate vertical corridor on the right.
- Put blue's goal in the vertical corridor.
- Put orange's goal at the end of the top corridor.
- The top wall should pin orange while blue moves down.

### Level 5

- Use one orange player.
- Place one black hole directly ahead in the same column.
- Avoid all other mechanics.

### Level 6

- Reuse the same movement lesson as Level 3.
- Replace one of the goals with a black hole.
- End with one player locked on a goal and one absorbed.

### Level 7

- Use one orange player.
- Put a kill tile directly in the straight route to the goal.
- Leave enough side space for a one-tile detour.

### Level 8

- Use one orange player.
- Put a checkpoint on the main route.
- Put a kill tile near the late route so the relationship between progress and danger is readable.

### Level 9

- Use one orange player.
- Put one pushable block between the player and the corridor to the goal.
- Add one cell of space above the block so it can be pushed out of the way.

### Level 10

- Use one orange player facing up and one cyan player facing right.
- Put plate `1` on orange's path.
- Put door `1` on cyan's path.
- Start cyan far enough away that the first activation step only stages the crossing.

## Levels 11-20

The second batch keeps the same rule set: basic and easy-medium only. These levels widen the player's vocabulary without introducing full multi-system puzzles yet.

### Level 11 - Push Aside

- Players: 1
- Mechanic: second push-block lesson
- Goal: teach that a block can be moved out of a lane, not only forward toward a finish
- Intended shape: open room with a central block and a goal below

### Level 12 - Weighted Door

- Players: 1
- Mechanic: block on plate opens door
- Goal: teach that a block can hold a plate for you
- Intended shape: plate above block, door to the right, goal behind the door

### Level 13 - Relay

- Players: 2
- Mechanic: second plate-and-door lesson
- Goal: one player activates the plate while the other crosses and finishes
- Intended shape: short orange lane into a plate, short cyan lane through a door

### Level 14 - After You

- Players: 2
- Mechanic: plate-holder finishes after the traveler
- Goal: teach that a player can hold the route open, then finish later once the other player is locked
- Intended shape: same structure as Level 13, but with a second goal for the plate-holder

### Level 15 - Black Ice

- Players: 1
- Mechanic: ice introduction
- Goal: teach that stepping onto ice causes sliding until a non-ice stop
- Intended shape: straight vertical ice strip with the goal at the far end

### Level 16 - Ice Brakes

- Players: 1
- Mechanic: ice with stopping points
- Goal: teach that walls and floor islands define where a slide can end
- Intended shape: square ice patch with a small pocket and a goal near the top

### Level 17 - No Return

- Players: 1
- Mechanic: one-way introduction
- Goal: teach that some tiles can only be entered from one side
- Intended shape: straight approach from below into a one-way gate leading to the goal

### Level 18 - Clockwise

- Players: 1
- Mechanic: one-way routing
- Goal: teach that one-way gates can force a path around a loop
- Intended shape: small maze with a clockwise-feeling route to the finish

### Level 19 - Moving Sidewalk

- Players: 1
- Mechanic: conveyor introduction
- Goal: teach that conveyors keep moving the player in a fixed direction
- Intended shape: short conveyor strip that carries the player toward the goal

### Level 20 - Ride and Rest

- Players: 1
- Mechanic: conveyor with a turn
- Goal: teach that conveyors can be ridden through a route rather than treated as a single gimmick tile
- Intended shape: L-shaped conveyor lane ending near the goal

## Current Scope

Implemented now:

- Levels 1-10: core movement, walls, black holes, kill tiles, checkpoint, push block, first door/plate
- Levels 11-20: second push and door/plate lessons, first ice pair, first one-way pair, first conveyor pair

Still intentionally deferred:

- mud
- crumble
- toggle systems
- conveyors combined with multi-player timing
- medium/hard puzzle chains
