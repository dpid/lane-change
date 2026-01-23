# Lane Change

A motorcycle endless runner game built with Three.js and TypeScript.

## Gameplay

Switch lanes to avoid obstacles and collect coins. Collect 3 coins in a row to complete a streak, increase your speed, and trigger a wheelie. The game starts at a comfortable pace but speeds up over time, reaching maximum intensity after about two minutes. How far can you go?

**Controls:**
- **Space/Enter** - Switch lanes
- **Mouse click** - Switch lanes
- **Touch** - Switch lanes (mobile)

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
├── config/          # Game constants (physics, spawn, animation)
├── controllers/     # Motorcycle control
├── factories/       # Entity creation (obstacles, powerups, scenery)
├── loaders/         # Asset loading (VOX models)
├── systems/         # Game systems
│   ├── ScrollManager.ts    # World container and scroll control
│   ├── ItemManager.ts      # Item spawning and collision (deck-based)
│   ├── Background.ts       # Sky and roadside signs (pooled)
│   └── Ground.ts           # Road, grass, lane markings (pooled)
├── effects/         # Visual effects
│   ├── SmokeSystem.ts      # Exhaust smoke particles (pooled)
│   └── WindSystem.ts       # Speed lines during wheelies (pooled)
├── animation/       # Visual animations
├── input/           # Input handling (keyboard, mouse, touch)
├── pooling/         # Object pooling for performance
└── ui/              # User interface
```

## Architecture

The game uses a world scroll container pattern. A `ScrollManager` owns a container that holds all scrolling content. When playing, the container scrolls forward. When the player dies, the container stops but obstacles continue moving with their own velocity (appearing to drive off into the distance).

All spawned entities (items, lane markings, signs) use object pooling with a spawn/despawn pattern to avoid garbage collection pressure. Items are spawned using a deck system that draws from a shuffled deck and reshuffles when exhausted, ensuring consistent distribution with varied order.

## License

MIT
