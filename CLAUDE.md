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
├── smoke particles (pooled, emitted during gameplay)
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

ScrollManager owns speed progression state. Speed increases with coin streaks:

- `BASE_SCROLL_SPEED`: 40 units/sec (starting speed)
- `MAX_SPEED_MULTIPLIER`: 5 (caps at 200 units/sec)
- `COINS_PER_STREAK`: 3 coins to complete a streak
- `STREAKS_TO_MAX_SPEED`: 10 streaks to reach max speed

**Key behaviors:**
- Each completed streak increases the speed multiplier
- Spawn intervals decrease proportionally (`1 / multiplier`) to maintain visual density
- Lane switch speed and lean angle scale with speed multiplier (base values are 1/5 of max)
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

### Asset Loading

VOX models (MagicaVoxel format) are loaded via `AssetLoader` singleton at startup:
- Models stored in `public/models/` for static serving
- `AssetLoader.loadAll()` preloads all models before game starts
- `Game.init()` is async to await asset loading
- Cloned meshes are used for pooled entities to avoid re-parsing

### Vehicle Tinting

Vehicles spawn with randomly selected body colors from `VehicleTintColors`. The tinting system:
- Detects white/near-white materials (RGB > 0.95 threshold)
- Clones the material before modifying to avoid affecting other instances
- Applies tint only to body parts, leaving wheels/windows unchanged

### Input System

Input providers emit actions through InputManager. Currently supports keyboard, mouse, and touch.

### Smoke Particle System

`SmokeSystem` provides exhaust smoke behind the motorcycle using a simple array pool:
- Particles are box meshes with transparent materials
- Continuous emission during PLAYING state, synced to scroll speed
- Particles drift toward camera (+Z) matching world scroll direction
- Hemispherical crash burst on death, intensity scales with scroll speed
- Config in `src/config/particles.config.ts`

### Celebration Particle System

`CelebrationSystem` emits colorful particle bursts on coin collection:
- Hemispherical burst of gold/white particles at coin position
- Particles arc upward with gravity, fading out near end of life
- Triggered by `ItemManager` when coins are collected
- Config in `src/config/celebration.config.ts`

### Wheelie Animation

`MotorcycleAnimator` handles a wheelie animation triggered on coin streak completion:
- Overlay animation that runs independently of AnimationState (RUNNING, JUMPING, etc.)
- Uses X-axis rotation (pitch), separate from Z-axis lean (roll) during lane switches
- ScrollManager notifies via `onStreakComplete` callback when `COINS_PER_STREAK` coins collected
- Animation phases: quick ease-in (0.1s), sustain at max angle, ease-out (0.4s)
- Config in `src/config/animation.config.ts`

### Wind Effect

`WindSystem` provides Mario Kart-style speed lines during wheelies:
- Elongated white box meshes streaming from front to back
- Activates when `motorcycle.isWheelieActive()` returns true
- Particles spawn ahead of motorcycle with random X/Y spread
- Move straight toward camera at high velocity (80 units/sec)
- Short lifetime (0.25s) with opacity fade in final 30%
- Config in `src/config/wind.config.ts`

### Audio System

`AudioManager` handles background music with mute toggle:
- Loops `soundtrack.mp3` during gameplay
- Starts on play/restart, fades out on death
- Mute toggle (M key) with preference saved to localStorage
- Uses touchend event for mobile audio compatibility

## Key Files

- `src/Game.ts` - Main game loop and state management (async init)
- `src/loaders/AssetLoader.ts` - VOX model loading and caching
- `src/systems/ScrollManager.ts` - World container, scroll control, streak tracking
- `src/systems/ItemManager.ts` - Item spawning, pooling, collision (deck-based)
- `src/systems/Ground.ts` - Road, grass, lane dashes, edge lines (pooled)
- `src/systems/Background.ts` - Sky and roadside signs (pooled)
- `src/effects/SmokeSystem.ts` - Exhaust smoke particles (pooled)
- `src/effects/CelebrationSystem.ts` - Coin collection particle bursts (pooled)
- `src/effects/WindSystem.ts` - Speed line effect during wheelies (pooled)
- `src/animation/MotorcycleAnimator.ts` - Motorcycle animations (wheels, lean, wheelie)
- `src/audio/AudioManager.ts` - Background music with mute toggle
- `src/config/` - All magic numbers extracted to config files
- `public/models/` - MagicaVoxel .vox assets

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
