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
├── motorcycle + shadow (fixed position, lane switching only)
└── worldContainer (scrolls during gameplay)
    ├── background buildings (with wrapping)
    ├── lane markings + edge lines (with wrapping)
    ├── obstacles (own velocity relative to container)
    └── powerups (own velocity relative to container)
```

**Key behaviors:**
- World container scrolls at `SCROLL_SPEED` when playing
- Obstacles/powerups have their own velocity relative to the container
- On game over: container stops, but obstacles continue moving (driving off into distance)
- Fixed elements (sky, road plane) stay in scene directly

### Object Pooling

Obstacles and powerups use object pools to avoid GC pressure. Pools pre-allocate objects and reuse them via acquire/release.

### Input System

Input providers emit actions through InputManager. Currently supports keyboard, mouse, and touch.

## Key Files

- `src/Game.ts` - Main game loop and state management
- `src/systems/ScrollManager.ts` - World container and scroll control
- `src/systems/ObstacleManager.ts` - Obstacle spawning, pooling, collision
- `src/systems/PowerupManager.ts` - Coin spawning and collection
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
