# Lane Change

A motorcycle endless runner game built with Three.js and TypeScript.

## Gameplay

Switch lanes to avoid obstacles and collect coins. How far can you go?

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
- **TypeScript** - Type safety
- **Vite** - Build tooling

## Project Structure

```
src/
├── main.ts          # Entry point
├── Game.ts          # Main game loop
├── config/          # Game constants
├── controllers/     # Motorcycle control
├── factories/       # Entity creation
├── systems/         # Game systems (obstacles, powerups, background)
├── animation/       # Visual animations
├── input/           # Input handling
├── pooling/         # Object pooling
└── ui/              # User interface
```

## License

MIT
