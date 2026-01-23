# Lane Change

A motorcycle endless runner game built with Three.js and TypeScript.

## Gameplay

Switch lanes to avoid obstacles and collect coins. Collect 3 coins in a row to complete a streak, increase your speed, and trigger a wheelie. Complete 10 streaks to reach maximum speed. You have 3 seconds of invincibility when you start - use it to get your bearings!

**Controls:**
- **Space** - Switch lanes
- **Mouse click** - Switch lanes
- **Touch** - Switch lanes (mobile)
- **M** - Toggle music mute

**Scoring:**
- Pass an obstacle: 1 point
- Collect a coin: 5 points

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## Tech Stack

- **Three.js** - 3D graphics
- **MagicaVoxel** - Voxel art assets (.vox format)
- **TypeScript** - Type safety
- **Vite** - Build tooling

## Project Structure

```
public/
└── models/          # MagicaVoxel .vox assets
src/
├── main.ts          # Entry point
├── Game.ts          # Main game loop and state management
├── animation/       # Visual animations
├── audio/           # Background music and sound effects
├── config/          # Game constants (physics, spawn, animation, pools)
├── controllers/     # Motorcycle control
├── factories/       # Entity creation (obstacles, powerups, scenery)
├── loaders/         # Asset loading (VOX models)
├── systems/         # Game systems
│   ├── ScrollManager.ts    # World container and scroll control
│   ├── CameraController.ts # Camera spring physics and zoom
│   ├── ItemManager.ts      # Item spawning and collision
│   ├── Item.ts             # Item entity class
│   ├── SpawnDeck.ts        # Deck-based spawn distribution
│   ├── Background.ts       # Sky and roadside signs (pooled)
│   └── Ground.ts           # Road, grass, lane markings (pooled)
├── effects/         # Visual effects
│   ├── BaseParticleSystem.ts # Abstract base for particles
│   ├── SmokeSystem.ts      # Exhaust smoke particles (pooled)
│   ├── CelebrationSystem.ts # Coin collection bursts (pooled)
│   ├── WindSystem.ts       # Speed lines during wheelies (pooled)
│   └── VoxelBurstSystem.ts # Death explosion effect
├── input/           # Input handling (keyboard, mouse, touch)
├── pooling/         # Object pooling for performance
├── utils/           # Shared utilities (easing, textures)
└── ui/              # User interface
```

## Architecture

The game uses a world scroll container pattern. A `ScrollManager` owns a container that holds all scrolling content. When playing, the container scrolls forward. When the player dies, the container stops but obstacles continue moving with their own velocity (appearing to drive off into the distance).

All spawned entities (items, lane markings, signs) use object pooling with a spawn/despawn pattern to avoid garbage collection pressure. Items are spawned using a deck system that draws from a shuffled deck and reshuffles when exhausted, ensuring consistent distribution with varied order.

## License

MIT
