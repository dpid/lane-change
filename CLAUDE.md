# Lane Change - Development Guide

## Architecture

### World Scroll Container

The game uses a `ScrollManager` that owns a `worldContainer` (THREE.Group) holding all scrolling content:

```
scene
├── lights (ambient, directional)
├── camera
├── sky (fixed)
├── road plane (fixed)
├── grass planes (fixed, flanking road)
├── motorcycle + shadow (fixed position, lane switching only)
└── worldContainer (scrolls during gameplay)
    ├── roadside signs (pooled, spawn/despawn)
    ├── lane markings + edge lines (pooled, spawn/despawn)
    ├── obstacles (pooled, own velocity relative to container)
    └── powerups (pooled, own velocity relative to container)
```

**Key behaviors:**
- World container scrolls at dynamic speed (base speed × multiplier) when playing
- Obstacles/powerups have their own velocity relative to the container
- On game over: container stops, progression resets, obstacles continue at base speed
- Fixed elements (sky, road plane) stay in scene directly

### Speed Progression

ScrollManager owns speed progression state. Speed increases over time using a quadratic ease-out curve:

- `BASE_SCROLL_SPEED`: 20 units/sec (starting speed)
- `MAX_SPEED_MULTIPLIER`: 2.5 (caps at 50 units/sec)
- `SPEED_RAMP_DURATION`: 120 seconds to reach ~100% of max

**Key behaviors:**
- Progression only advances during PLAYING state (not DROPPING)
- Spawn intervals decrease proportionally (`1 / multiplier`) to maintain visual density
- On death: progression resets so game over items move at base speed
- On restart: full reset via `scrollManager.reset()`

### Object Pooling

All spawned entities use object pools to avoid GC pressure. Pools pre-allocate objects and reuse them via acquire/release:
- Items (obstacles and coins) spawn at `SPAWN_Z` and despawn at `DESPAWN_Z`
- Lane dashes, edge lines, and roadside signs follow the same pattern
- Spawn intervals are calculated from element spacing divided by scroll speed

### Spawn Deck System

Items are spawned using a deck-based system (`SpawnDeck` in `ItemManager.ts`):
- A deck is built from `ItemDefinitions` card counts (e.g., 80 obstacles, 30 coins, 10 gaps)
- Cards are drawn and placed in a discard pile
- When the deck is empty, the discard pile is shuffled back into the deck
- This ensures consistent item distribution while varying order each cycle

### Input System

Input providers emit actions through InputManager. Currently supports keyboard, mouse, and touch.

## Key Files

- `src/Game.ts` - Main game loop and state management
- `src/systems/ScrollManager.ts` - World container and scroll control
- `src/systems/ItemManager.ts` - Item spawning, pooling, collision (deck-based)
- `src/systems/Ground.ts` - Road, grass, lane dashes, edge lines (pooled)
- `src/systems/Background.ts` - Sky and roadside signs (pooled)
- `src/config/` - All magic numbers extracted to config files

## Game States

```
MENU → DROPPING → PLAYING → DYING → GAME_OVER
                    ↑                    │
                    └────────────────────┘ (restart)
```

## Conventions

- Use config files for magic numbers
- Factories create geometry, managers handle lifecycle
- Positions in world container are local; account for container offset when needed
