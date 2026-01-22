# Lane Change - Architecture Overview

A motorcycle endless runner game built with Three.js and TypeScript.

## Quick Reference

- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Preview:** `npm run preview`
- **Entry point:** `src/main.ts` → `src/Game.ts`

## Project Structure

```
src/
├── main.ts              # Bootstrap - creates Game instance
├── Game.ts              # Main orchestrator - scene, render loop, state machine
├── config/              # Centralized constants (physics, spawn rates, colors, animation)
├── controllers/         # MotorcycleController, CharacterController
├── factories/           # Entity creation (motorcycle, obstacles, powerups, scenery)
├── systems/             # Background, Ground, ObstacleManager, PowerupManager
├── animation/           # MotorcycleAnimator - handles visual states
├── input/               # InputManager + PlayerInputProvider
├── pooling/             # ObjectPool for performance
└── ui/                  # UI layer
```

## Game States

`MENU` → `DROPPING` → `PLAYING` → `DYING` → `GAME_OVER`

## Core Systems

### MotorcycleController (`src/controllers/MotorcycleController.ts`)
Manages motorcycle state, lane switching, and collision bounds. Uses `CharacterController` for state machine and `MotorcycleAnimator` for visuals.

### ObstacleManager (`src/systems/ObstacleManager.ts`)
Spawns CAR, TRUCK, OIL_SLICK obstacles at random intervals. Uses object pooling. Handles collision detection and tracks passed obstacles for scoring.

### PowerupManager (`src/systems/PowerupManager.ts`)
Spawns coins at fixed intervals (5s). Manages collection detection with expanded hitboxes.

### Background (`src/systems/Background.ts`)
Three parallax layers with procedural buildings and gradient sky shader.

### Ground (`src/systems/Ground.ts`)
Road plane with lane markings that wrap for infinite scrolling.

## Key Patterns

### Factory Pattern
All entities created via factories returning `GeometryParts`:
```typescript
interface GeometryParts {
  root: THREE.Group
  parts: Map<string, Object3D>
}
```

### Object Pooling
`ObjectPool<T extends PooledEntity>` reuses instances to reduce GC pressure.

### Event Emitter
`CharacterEventEmitter` for motorcycle events (dropComplete, land, dieComplete).

### Provider Pattern
`InputProvider` interface allows multiple input sources (keyboard, mouse, touch).

## Physics Config (`src/config/physics.config.ts`)
- `SCROLL_SPEED: 20` - World movement speed
- `LANE_LEFT_X: -1.5`, `LANE_RIGHT_X: 1.5` - Lane positions
- `LANE_SWITCH_SPEED: 8` - Lane change rate
- `GRAVITY: 20` - Fall acceleration

## Collision Detection
- Uses Three.js `Box3` AABB
- Collision boxes shrunk by 0.1 for forgiving hitboxes
- Collection boxes expanded by 0.15 for easier pickups
- Lane-based: only collide if in same lane

## Scoring
- 1 point per obstacle passed
- 5 points per coin collected

## Game Loop (`Game.animate`)
1. Calculate delta time (capped at 100ms)
2. Update background/ground parallax
3. Update obstacles/powerups
4. Update motorcycle animation
5. Check collisions and collection
6. Update score
7. Render

## Adding New Features

**New obstacle type:** Add to `ObstacleType` enum, implement in `ObstacleFactory.build()`

**New powerup type:** Add to `PowerupType` enum, implement in `PowerupFactory.build()`

**New input source:** Implement `InputProvider` interface

**Difficulty scaling:** Adjust `SpawnConfig` values dynamically
