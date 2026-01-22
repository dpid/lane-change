# Implementation Plan: Full Lane Change Game Setup

## Overview

This plan creates a complete motorcycle endless runner game using the proven architecture patterns from high-noon-hustle. The core mechanic changes from jumping over obstacles to switching between two lanes while avoiding oncoming traffic. The game uses a **third-person chase camera** perspective with the motorcycle facing forward down the road.

**COORDINATE SYSTEM:**
- Motorcycle faces forward along -Z axis (toward horizon)
- Camera is behind motorcycle at +Z position, looking toward -Z
- Lanes are on X-axis: left lane = negative X, right lane = positive X
- Obstacles spawn far ahead at negative Z and move toward camera (+Z direction)
- Ground plane is STATIC (does not scroll)
- Lane markings scroll in +Z direction to show motion

## Architecture Decisions

1. **State Machine Pattern**: Use Game.ts with GameState enum (MENU → PLAYING → DYING → GAME_OVER), identical to high-noon-hustle
2. **Factory Pattern**: Replace CowboyFactory with MotorcycleFactory for voxel motorcycle, adapt ObstacleFactory for vehicles
3. **Controller Architecture**: Replace CowboyController with MotorcycleController handling lane switching instead of jumping
4. **Animator Pattern**: Create MotorcycleAnimator for wheel rotation and lean animations during lane changes
5. **Two-Lane System**: Lanes at X = -1.5 (left) and X = +1.5 (right), motorcycle switches between them
6. **Object Pooling**: Use identical ObjectPool pattern for obstacles (cars, trucks, oil slicks) and powerups (coins)
7. **Input System**: Reuse InputManager architecture but map all inputs (click/tap/space) to lane toggle action
8. **Background**: City parallax layers on sides of road (X-axis positioning), scrolling in +Z direction
9. **Ground**: Static road plane with lane markings scrolling in +Z direction
10. **Chase Camera**: Fixed camera position behind motorcycle, looking down the road
11. **No OpenGameSDK**: Remove OGP integration from high-noon-hustle, use simple local scoring only

## Implementation Phases

### Phase 1: Project Initialization and Core Structure

**Goal:** Set up npm project, TypeScript configuration, directory structure, and basic build system.

**Steps:**
1. Initialize npm project with `npm init -y`
2. Install dependencies: `npm install three @types/three typescript vite`
3. Create `tsconfig.json` with strict TypeScript settings
4. Create `vite.config.ts` for development server configuration
5. Create directory structure:
   ```
   src/
     config/
       physics.config.ts
       spawn.config.ts
       animation.config.ts
       colors.config.ts
       index.ts
     factories/
       GeometryFactory.ts
       MotorcycleFactory.ts
       ObstacleFactory.ts
       PowerupFactory.ts
       SceneryFactory.ts
       index.ts
     animation/
       AnimationController.ts
       MotorcycleAnimator.ts
       index.ts
     controllers/
       CharacterController.ts
       MotorcycleController.ts
       index.ts
     input/
       InputAction.ts
       InputProvider.ts
       PlayerInputProvider.ts
       InputManager.ts
       index.ts
     pooling/
       PooledEntity.ts
       ObjectPool.ts
       index.ts
     systems/
       Background.ts
       Ground.ts
       ObstacleManager.ts
       PowerupManager.ts
     ui/
       UI.ts
     Game.ts
     main.ts
   index.html
   ```
6. Create `index.html` with canvas container and UI elements (menu, score, game over)
7. Add npm scripts to `package.json`:
   ```json
   "scripts": {
     "dev": "vite",
     "build": "tsc && vite build",
     "preview": "vite preview"
   }
   ```

**Files to create:**
- `/home/damon/Projects/lane-change/package.json` - dependencies and scripts
- `/home/damon/Projects/lane-change/tsconfig.json` - TypeScript config
- `/home/damon/Projects/lane-change/vite.config.ts` - Vite config
- `/home/damon/Projects/lane-change/index.html` - HTML structure with UI overlays
- All directory structure files listed above

**Testing:**
- Run `npm install` without errors
- Run `npm run dev` and see Vite dev server start
- Verify TypeScript compilation works with empty files

**Note:** This is a greenfield project without existing `.claude/context/` conventions. Project patterns will be established as the codebase is built, following high-noon-hustle architecture.

### Phase 2: Configuration Files

**Goal:** Define all game constants for physics, spawning, animation, and visual design.

**Steps:**
1. Create `physics.config.ts` with constants:
   - `SCROLL_SPEED`: 10 (obstacles move in +Z direction)
   - `LANE_SWITCH_SPEED`: 8 (lateral X-axis movement speed)
   - `LANE_LEFT_X`: -1.5 (left lane position)
   - `LANE_RIGHT_X`: 1.5 (right lane position)
   - `DROP_START_Y`: 5 (motorcycle drops from above)
   - `CRASH_POP_VELOCITY`: 6
   - `CRASH_FALL_Y`: -5
   - `CRASH_SPIN_SPEED`: 15
   - Shadow constants for motorcycle
2. Create `spawn.config.ts` with constants:
   - `OBSTACLE_SPAWN_Z`: -30 (far ahead on road)
   - `OBSTACLE_DESPAWN_Z`: 5 (past camera)
   - `OBSTACLE_MIN_SPAWN_INTERVAL`: 1.2
   - `OBSTACLE_MAX_SPAWN_INTERVAL`: 2.5
   - `POWERUP_SPAWN_INTERVAL`: 5
   - Background layer X positions (buildings on sides of road)
   - Parallax scroll speeds for background layers
3. Create `animation.config.ts` with constants:
   - `WHEEL_ROTATION_SPEED`: 15
   - `LEAN_ANGLE`: 0.4 (radians, for lane switching)
   - `LEAN_TRANSITION_SPEED`: 6
4. Create `colors.config.ts` with color palettes:
   - `MotorcycleColors`: body, chassis, wheels, rider helmet/jacket
   - `ObstacleColors`: sedans (multiple colors), trucks, oil slicks
   - `PowerupColors`: coin gold
   - `EnvironmentColors`: sky gradient, road gray, lane markings white, city buildings, roadside objects
5. Create barrel `index.ts` to export all configs

**Files to create:**
- `/home/damon/Projects/lane-change/src/config/physics.config.ts`
- `/home/damon/Projects/lane-change/src/config/spawn.config.ts`
- `/home/damon/Projects/lane-change/src/config/animation.config.ts`
- `/home/damon/Projects/lane-change/src/config/colors.config.ts`
- `/home/damon/Projects/lane-change/src/config/index.ts`

**Testing:**
- Import configs in a test file
- Verify all constants are accessible and typed correctly

### Phase 3: Base Interfaces and Patterns

**Goal:** Implement foundational interfaces and helper classes used throughout the codebase.

**Steps:**
1. Create `GeometryFactory.ts` interface:
   - Copy from high-noon-hustle exactly
   - `GeometryParts` interface with root group and parts map
   - `GeometryFactory<TOptions>` interface
   - `disposeGeometryParts` helper function
2. Create `AnimationController.ts` interface:
   - Copy `AnimationState` enum from high-noon-hustle (reuse IDLE, RUNNING, JUMPING, DYING, DROPPING)
   - **Note**: JUMPING state is semantically repurposed for lane switching in this game
   - `AnimationController` interface with attach/detach/setState/update/reset methods
   - Graceful degradation pattern documentation
3. Create `PooledEntity.ts` interface:
   - Copy from high-noon-hustle exactly
   - `active`, `activate()`, `deactivate()`, `reset()` methods
4. Create `ObjectPool.ts` generic class:
   - Copy from high-noon-hustle exactly
   - Generic expandable pool with factory pattern
   - Pre-allocation and max size support
5. Create `CharacterController.ts` interface:
   - Adapt from high-noon-hustle
   - Change `jump()` to `switchLane()` semantically (implementation in controller)
   - Keep event emitter mixin pattern
   - Events: 'dropComplete', 'land', 'dieComplete', 'loseGeometry' (helmet instead of hat)
6. Create `InputAction.ts` and `InputProvider.ts`:
   - Define `InputActionType.SWITCH_LANE` (replaces JUMP)
   - `InputAction` interface with type and optional data
   - `InputProvider` interface with enable/disable/onAction methods
7. Create `InputManager.ts`:
   - Copy from high-noon-hustle exactly
   - Routes actions from providers to handlers
   - Supports multiple providers

**Files to create:**
- `/home/damon/Projects/lane-change/src/factories/GeometryFactory.ts`
- `/home/damon/Projects/lane-change/src/animation/AnimationController.ts`
- `/home/damon/Projects/lane-change/src/pooling/PooledEntity.ts`
- `/home/damon/Projects/lane-change/src/pooling/ObjectPool.ts`
- `/home/damon/Projects/lane-change/src/controllers/CharacterController.ts`
- `/home/damon/Projects/lane-change/src/input/InputAction.ts`
- `/home/damon/Projects/lane-change/src/input/InputProvider.ts`
- `/home/damon/Projects/lane-change/src/input/InputManager.ts`

**Testing:**
- Create test instances of ObjectPool with simple objects
- Verify acquire/release cycle works correctly
- Test event emitter pattern in CharacterEventEmitter

### Phase 4: Motorcycle Factory and Geometry

**Goal:** Create voxel-style motorcycle with rider using factory pattern.

**Steps:**
1. Implement `MotorcycleFactory` implementing `GeometryFactory`:
   - Use consistent voxel/blocky style with THREE.BoxGeometry
   - Build motorcycle chassis: front fork, main body, rear section
   - Build two wheels: front and rear (cylindrical or box-based)
   - Build rider: seated figure with helmet, torso, arms on handlebars
   - Optional details: handlebars, headlight, exhaust pipes
   - Name parts in map: 'frontWheel', 'rearWheel', 'bodyPivot', 'riderGroup', 'helmetGroup'
   - Pivot at ground level (y=0) for easy positioning
   - **Face forward along -Z axis** (motorcycle looks down the road toward horizon)
2. Use `MotorcycleColors` config for consistent coloring
3. Implement `dispose()` method using `disposeGeometryParts` helper
4. Create barrel `index.ts` exporting factory and GeometryParts type

**Files to create:**
- `/home/damon/Projects/lane-change/src/factories/MotorcycleFactory.ts`
- `/home/damon/Projects/lane-change/src/factories/index.ts`

**Testing:**
- Create test scene with motorcycle geometry
- Verify all parts are properly named in parts map
- Verify motorcycle faces -Z direction (toward horizon)
- Check dispose properly cleans up Three.js resources

### Phase 5: Motorcycle Animator

**Goal:** Implement animation controller for wheel rotation and lean effects.

**Steps:**
1. Implement `MotorcycleAnimator` implementing `AnimationController`:
   - Extract part references: frontWheel, rearWheel, bodyPivot, helmetGroup
   - Graceful degradation: null checks for all parts
2. Animation states:
   - `DROPPING`: Wheels not spinning, no lean
   - `RUNNING`: Constant wheel rotation around Z-axis (wheels spin as motorcycle moves forward)
   - `JUMPING`: Continue wheel rotation, lean left/right based on target lane (repurposed for lane switching)
   - `DYING`: Stop wheel rotation, tumble/spin bodyPivot
3. Wheel animation:
   - Rotate frontWheel and rearWheel around Z-axis continuously when RUNNING/JUMPING
   - Rotation speed from `AnimationConfig.WHEEL_ROTATION_SPEED`
   - **Z-axis rotation** makes wheels appear to roll forward as bike moves down road
4. Lean animation:
   - When switching lanes, tilt bodyPivot on Z-axis toward target lane
   - Use `AnimationConfig.LEAN_ANGLE` and `AnimationConfig.LEAN_TRANSITION_SPEED`
   - Smooth lerp back to upright when lane switch complete
5. Death animation:
   - Spin bodyPivot around multiple axes
   - Stop wheel rotation
6. Implement `reset()` to restore all transforms

**Files to create:**
- `/home/damon/Projects/lane-change/src/animation/MotorcycleAnimator.ts`
- `/home/damon/Projects/lane-change/src/animation/index.ts`

**Testing:**
- Attach animator to motorcycle geometry
- Step through each animation state manually
- Verify wheels rotate around Z-axis (rolling forward)
- Verify lean animation looks natural
- Test reset returns to initial state

### Phase 6: Motorcycle Controller

**Goal:** Implement character controller with lane switching mechanics.

**Steps:**
1. Implement `MotorcycleController` extending `CharacterEventEmitter`:
   - Compose `MotorcycleFactory` and `MotorcycleAnimator`
   - Track state: CharacterState enum from high-noon-hustle
   - Track current lane: `currentLane` ('left' | 'right')
   - Track lane switching: `isLaneSwitching`, `targetLane`, `laneProgress`
2. Implement `switchLane()` method:
   - Toggle between left and right lanes
   - Start lane switch animation if in RUNNING state
   - Set targetLane and isLaneSwitching flag
   - **Interpolate X position** between LANE_LEFT_X and LANE_RIGHT_X
3. Implement `getCurrentLane(): 'left' | 'right'` method:
   - Returns discrete lane state for collision detection
   - Based on which lane motorcycle is closest to or committed to
   - Used by ObstacleManager and PowerupManager for accurate collision checks
4. Physics state:
   - Vertical drop physics same as high-noon-hustle (DROPPING state)
   - **Lateral lane interpolation on X-axis** during lane switch
   - No jumping physics needed
   - Motorcycle Z position stays constant (positioned at origin or camera focal point)
5. Update method per state:
   - `DROPPING`: Vertical drop with gravity, emit 'dropComplete' on landing
   - `RUNNING`: Idle at current lane X position, call animator.update()
   - `JUMPING`: **Smooth lerp X position** toward target lane, emit 'land' when complete
   - `DYING`: Physics same as high-noon-hustle death animation
6. Collision bounding box:
   - Return Box3 around motorcycle position
   - Smaller than visual bounds for forgiving gameplay
7. Hitpoint system (simplified, no helmet mechanic):
   - Single hitpoint, collision triggers immediate death
   - Call `die()` method which sets DYING state and emits 'dieComplete' later
8. Shadow rendering:
   - Copy pattern from high-noon-hustle (CowboyController.ts lines 89-90)
   - **Important**: Shadow must track both X and Z positions during lane switches
   - Update shadow position to follow motorcycle on both axes

**Files to create:**
- `/home/damon/Projects/lane-change/src/controllers/MotorcycleController.ts`
- `/home/damon/Projects/lane-change/src/controllers/index.ts`

**Testing:**
- Instantiate controller in test scene
- Call `dropIn()` and verify drop animation
- Call `switchLane()` repeatedly and verify smooth X-axis lane transitions
- Test `getCurrentLane()` returns correct lane during and after lane switches
- Test collision detection with bounding box
- Verify death animation triggers correctly
- Verify shadow follows motorcycle position in both X and Z axes

### Phase 7: Obstacle Factory

**Goal:** Create factories for traffic obstacles (cars, trucks, oil slicks).

**Steps:**
1. Implement `ObstacleFactory` with enum `ObstacleType`:
   - `CAR`: sedan-style vehicle, randomized colors
   - `TRUCK`: larger vehicle, single color
   - `OIL_SLICK`: flat hazard on road surface
2. Build car geometry:
   - Box-based sedan shape: hood, cabin, trunk
   - Windows (darker boxes inset slightly)
   - Four wheels (small cylinders or boxes at corners)
   - Random color from `ObstacleColors.cars` array
   - Scale: roughly motorcycle height
3. Build truck geometry:
   - Larger box-based truck: cab and trailer/cargo bed
   - Bigger wheels
   - Single truck color from config
   - Taller and longer than cars
4. Build oil slick geometry:
   - Flat oval or rounded rectangle on ground (y=0.01)
   - Dark color with slight transparency
   - Small height to appear as road hazard
5. Options interface: `{ type: ObstacleType, lane: 'left' | 'right' }`
6. Return `GeometryParts` with root and parts map
7. **Orientation**: Obstacles face forward (+Z direction) same as motorcycle
   - Obstacles represent traffic moving in same direction
   - Player is catching up to slower traffic
   - All vehicles face -Z direction (same as motorcycle)

**Files to create:**
- `/home/damon/Projects/lane-change/src/factories/ObstacleFactory.ts`

**Testing:**
- Create instances of each obstacle type
- Verify geometry looks appropriate for scale
- Test random color selection for cars
- Verify obstacles face -Z direction (same as motorcycle)

### Phase 8: Powerup and Scenery Factories

**Goal:** Create coin powerups and roadside decorations.

**Steps:**
1. Implement `PowerupFactory`:
   - `COIN`: rotating gold coin (flat cylinder or octagon)
   - Spawn at rider height for collection
   - Simple geometry, single part
2. Implement `SceneryFactory` (optional decorations, low priority):
   - `STREETLIGHT`: tall post with light at top
   - `SIGN`: road sign on post
   - `BUILDING_EDGE`: partial building geometry at roadside
   - **Spawn on sides of road** (X = ±3 or more, outside lanes)
   - Non-collidable, visual only

**Files to create:**
- `/home/damon/Projects/lane-change/src/factories/PowerupFactory.ts`
- `/home/damon/Projects/lane-change/src/factories/SceneryFactory.ts`

**Testing:**
- Create powerup instances
- Verify coin geometry is visible and appropriately sized
- Test scenery placement on sides of road (X-axis positioning)

### Phase 9: Obstacle Manager with Pooling

**Goal:** Implement obstacle spawning, pooling, and collision detection.

**Steps:**
1. Create `Obstacle` class implementing `PooledEntity`:
   - Store: type, lane, passed flag, geometryParts
   - Implement activate/deactivate/reset methods
   - Update method: no animation needed (static obstacles)
   - `getBoundingBox()` method with slight shrink for forgiveness
2. Implement `ObstacleManager`:
   - Create ObjectPool for each obstacle type (CAR, TRUCK, OIL_SLICK)
   - Track activeObstacles array
   - Spawn timer with randomized intervals from config
3. Spawning logic:
   - Random obstacle type selection
   - Random lane assignment (left or right)
   - **Spawn at Z = OBSTACLE_SPAWN_Z** (far ahead, negative Z)
   - **Position at lane X coordinate** (LANE_LEFT_X or LANE_RIGHT_X)
4. Update method:
   - **Move obstacles in +Z direction** (toward camera/player) by scrollSpeed * delta
   - **Despawn when Z > OBSTACLE_DESPAWN_Z** (past camera)
   - Return to pool
5. Collision detection:
   - `checkCollision(motorcycleBox, currentLane)`: only check obstacles in current lane using discrete lane state from `motorcycleController.getCurrentLane()`
   - Box3 intersection test
6. Passed obstacle counting:
   - `getPassedObstacles(motorcycleZ)`: count obstacles that have passed the motorcycle's Z position
   - Used for scoring
7. Reset method: return all obstacles to pool

**Files to create:**
- `/home/damon/Projects/lane-change/src/systems/ObstacleManager.ts`

**Testing:**
- Create manager in test scene
- Verify obstacles spawn at negative Z (far ahead)
- Verify obstacles move in +Z direction (toward camera)
- Test lane assignment distribution (X positioning)
- Verify collision detection only checks current lane
- Test pool acquire/release cycle
- Verify passed obstacle counting

### Phase 9.5: Powerup Manager with Pooling

**Goal:** Implement coin spawning, collection detection, and score increments.

**Steps:**
1. Create `Powerup` class implementing `PooledEntity`:
   - Store: type ('coin'), lane, collected flag, geometryParts, rotation
   - Implement activate/deactivate/reset methods
   - Update method: rotate coin continuously for visual effect
   - `getBoundingBox()` method for collection detection
2. Implement `PowerupManager`:
   - Create ObjectPool for COIN type
   - Track activePowerups array
   - Spawn timer based on `SpawnConfig.POWERUP_SPAWN_INTERVAL`
3. Spawning logic:
   - Random lane assignment (left or right)
   - **Spawn at Z = OBSTACLE_SPAWN_Z** (same as obstacles, far ahead)
   - **Position at lane X coordinate**, elevated to rider height
4. Update method:
   - **Move powerups in +Z direction** (toward camera/player) by scrollSpeed * delta
   - Rotate coins for visual appeal
   - **Despawn when Z > OBSTACLE_DESPAWN_Z** (past camera)
   - Return to pool
5. Collection detection:
   - `checkCollection(motorcycleBox, currentLane)`: only check powerups in current lane using discrete lane state
   - Box3 intersection test (more generous hitbox than obstacles)
   - Return collected powerups to be removed from scene
6. Reset method: return all powerups to pool

**Files to create:**
- `/home/damon/Projects/lane-change/src/systems/PowerupManager.ts`

**Testing:**
- Create manager in test scene
- Verify coins spawn at negative Z (far ahead)
- Verify coins move in +Z direction (toward camera)
- Test lane X assignment distribution
- Verify collection detection works in both lanes
- Test rotation animation looks smooth
- Test pool acquire/release cycle

### Phase 10: Background System

**Goal:** Implement parallax city skyline background.

**Steps:**
1. Create `Background` class with multiple parallax layers:
   - Sky: gradient shader from light blue (top) to gray (horizon)
   - **Distant buildings layer (X = ±40)**: tall skyscrapers on both sides of road, very slow parallax (0.1x)
   - **Mid buildings layer (X = ±25)**: medium buildings on both sides, medium parallax (0.25x)
   - **Near objects layer (X = ±12)**: streetlights, signs on both sides, faster parallax (0.5x)
2. Each layer:
   - **Array of groups positioned along Z-axis** (stretching into distance)
   - **Wrap-around scrolling in +Z direction** (when Z > threshold, reset to far negative Z)
   - Different scroll speed multipliers
   - **Buildings/objects on both sides of road** (positive and negative X)
3. Building geometry:
   - Box-based skyscrapers with random heights
   - Window patterns (small lit boxes on faces)
   - Varied colors (grays, blues) from `EnvironmentColors`
   - Create multiple variants for visual variety
4. Update method:
   - **Scroll each layer in +Z direction** based on baseSpeed * layerSpeed * delta
   - Wrap positions when past camera threshold
   - Buildings on both sides scroll together

**Files to create:**
- `/home/damon/Projects/lane-change/src/systems/Background.ts`

**Testing:**
- Create background in test scene
- Verify parallax effect at different speeds
- Verify buildings on both sides of road (X-axis positioning)
- Test wrap-around logic in Z direction
- Ensure no visible popping or gaps

### Phase 11: Ground System

**Goal:** Implement static road with scrolling lane markings.

**Steps:**
1. Create `Ground` class:
   - **Large static ground plane** (dark gray road surface, does NOT move)
   - Two scrolling lane marking strips (white dashed lines in center)
   - Road edge markings (solid white lines on sides)
2. Lane markings:
   - Use small box meshes arranged in strips
   - **Scroll in +Z direction** to simulate forward movement
   - Wrap around when reaching threshold
   - **Positioned at X = 0** (center line between lanes)
3. Road edges:
   - Similar scrolling strip pattern
   - **Positioned at X = ±lane_width**
   - **Scroll in +Z direction** with lane markings
4. Optional road details:
   - Small debris objects scrolling with markings
   - Subtle texture or color variation
5. Update method:
   - **Scroll lane markings and edges in +Z direction**
   - Wrap positions when past camera
   - **Ground plane itself stays static**

**Files to create:**
- `/home/damon/Projects/lane-change/src/systems/Ground.ts`

**Testing:**
- Verify lane markings scroll in +Z direction smoothly
- Verify ground plane stays static (does not move)
- Test wrap-around without visible seams
- Check lane marking positions align with actual lane X coordinates

### Phase 12: Input System

**Goal:** Implement player input handling for lane switching.

**Steps:**
1. Implement `PlayerInputProvider` implementing `InputProvider`:
   - Listen for: click, touchstart, spacebar keydown
   - All inputs emit same action: `InputActionType.SWITCH_LANE`
   - Enable/disable methods add/remove event listeners
2. Keep InputManager from Phase 3 (already implemented)
3. Integration pattern:
   - Follow high-noon-hustle pattern (Game.ts lines 162-176)
   - Adapt to call `motorcycleController.switchLane()` instead of `player.jump()`
   - Wire up in Game.ts during Phase 14

**Files to create:**
- `/home/damon/Projects/lane-change/src/input/PlayerInputProvider.ts`
- `/home/damon/Projects/lane-change/src/input/index.ts`

**Testing:**
- Test each input method (click, touch, keyboard)
- Verify action routing through InputManager
- Test enable/disable functionality

### Phase 13: UI System

**Goal:** Implement menu, HUD, and game over screens.

**Steps:**
1. Create HTML structure in `index.html`:
   - Menu overlay: title, "Click/Tap to Start" message
   - Score display: positioned top-center during gameplay
   - Game over overlay: "Game Over", final score, "Click/Tap to Restart"
   - Style with CSS: centered overlays, motorcycle/city theme colors
2. Implement `UI` class:
   - Get DOM element references
   - `showMenu()`: display menu, hide others
   - `showGame()`: hide menu, show score
   - `showGameOver(finalScore)`: show game over with score
   - `updateScore(score)`: update score text
   - `onPlay(callback)`: listen for clicks when menu visible
   - `onPlayAgain(callback)`: listen for clicks when game over visible
3. **Simplified implementation**: Do not include OpenGameSDK integration
   - No OGP session management
   - No leaderboard submission
   - Simple local scoring only

**Files to create:**
- `/home/damon/Projects/lane-change/src/ui/UI.ts`
- Update `/home/damon/Projects/lane-change/index.html` with UI elements and styling

**Testing:**
- Verify all UI states display correctly
- Test click handlers for menu and game over
- Verify score updates in real-time

### Phase 14: Core Game State Machine

**Goal:** Implement main Game.ts with state machine orchestration.

**Steps:**
1. Create `Game` class with state machine:
   - Enum: `GameState { MENU, DROPPING, PLAYING, DYING, GAME_OVER }`
   - Three.js setup: renderer, scene, camera, lighting
   - Component instances: motorcycle, obstacleManager, powerupManager, background, ground, ui, inputManager
2. State transitions:
   - `MENU` → `DROPPING`: on play button click, call `motorcycleController.dropIn()`
   - `DROPPING` → `PLAYING`: on 'dropComplete' event from controller
   - `PLAYING` → `DYING`: when collision detected
   - `DYING` → `GAME_OVER`: on 'dieComplete' event from controller
   - `GAME_OVER` → `MENU`: on restart click, reset all systems
3. Initialize method:
   - Create all subsystems
   - Wire up event listeners (dropComplete, dieComplete)
   - Setup input handling (following high-noon-hustle lines 162-176 pattern)
   - Start render loop
4. **OpenGameSDK exclusion**:
   - Do NOT include OGP integration from high-noon-hustle (Game.ts lines 12-89)
   - Do NOT implement session management or leaderboard submission (lines 68-88)
   - Use simple local score variable only
5. Animate loop:
   - Update background and ground (all states except MENU)
   - Update obstacleManager (PLAYING only)
   - Update powerupManager (PLAYING only)
   - Check obstacle collisions (PLAYING only)
   - Check powerup collections and increment score (PLAYING only)
   - Count passed obstacles and update score (PLAYING only)
   - Update motorcycle (all states)
   - Render scene
6. Scoring:
   - Increment score for each passed obstacle
   - Increment score for each collected coin (higher value than obstacles)
   - Update UI with new score
7. **Camera positioning**:
   - **Camera positioned behind motorcycle at +Z**, looking toward -Z (down the road)
   - **Fixed camera relative to motorcycle** (motorcycle stays centered in view)
   - Camera slightly elevated and angled to see road ahead
   - Adjust for aspect ratio (handle window resize)
   - **Motorcycle position stays relatively constant in world space** (at or near origin)
   - **World (obstacles, scenery) moves toward camera** creating endless runner effect

**Files to create:**
- `/home/damon/Projects/lane-change/src/Game.ts`

**Testing:**
- Run full game loop
- Test state transitions: menu → drop → play → death → game over → restart
- Verify all systems update in correct states
- Verify camera is behind motorcycle looking down road (-Z direction)
- Verify obstacles approach from distance (-Z) and pass by camera (+Z)
- Test collision detection triggers death
- Test coin collection increments score
- Verify obstacle passing increments score
- Test total scoring (obstacles + coins)

### Phase 15: Main Entry Point

**Goal:** Create main.ts entry point to bootstrap the game.

**Steps:**
1. Create `main.ts`:
   - Import Game class
   - Create game instance
   - Call `game.init()`
   - Handle any global error cases
2. Update `index.html`:
   - Include module script tag loading main.ts
   - Ensure Vite processes it correctly

**Files to create:**
- `/home/damon/Projects/lane-change/src/main.ts`

**Testing:**
- Run `npm run dev`
- Verify game loads without errors
- Test full gameplay loop end-to-end

### Phase 16: Polish and Tuning

**Goal:** Refine gameplay feel, balance difficulty, fix visual issues.

**Steps:**
1. Tune physics constants:
   - Adjust scroll speed for appropriate difficulty
   - Tune lane switch speed for responsive feel
   - Balance obstacle spawn intervals
   - Balance powerup spawn intervals
2. Tune animation:
   - Ensure wheel rotation speed matches scroll speed visually
   - Adjust lean angle for good visual feedback without excessive tilt
   - Adjust coin rotation speed for visibility
3. Visual polish:
   - Verify all colors work well together
   - Ensure parallax speeds create good depth perception
   - Check lane marking visibility and spacing
   - Verify camera angle provides good view of approaching obstacles
4. Collision tuning:
   - Adjust bounding box sizes for fair but challenging gameplay
   - Test on both lanes
   - Ensure powerup collection hitbox is generous
5. Score balancing:
   - Ensure score increases at satisfying rate
   - Balance coin value vs obstacle passing value
6. Responsive layout:
   - Test UI on different screen sizes
   - Adjust camera on narrow screens if needed

**Files to modify:**
- Various config files for tuning values
- Visual tweaks in factories if needed

**Testing:**
- Playtest extensively
- Verify game is fun and challenging
- Test on different screen sizes
- Check for any visual glitches or edge cases

## Edge Cases

1. **Rapid lane switching**: Prevent lane switch spam by checking `isLaneSwitching` flag. Ignore input during active lane switch.
2. **Lane switch during collision**: If collision occurs mid-switch, continue switch animation but trigger death state. Position will complete interpolation even while dying.
3. **Obstacle spawning in wrong lane**: Ensure lane assignment is validated before positioning. Obstacles must align precisely with lane X coordinates.
4. **Obstacle pool exhaustion**: ObjectPool automatically expands if maxSize allows. Set maxSize = 0 (unlimited) for obstacle pools to prevent starvation.
5. **Collision at exact lane boundary**: Collision uses discrete lane state from `getCurrentLane()` method, not continuous X position. Only obstacles in the current committed lane are checked.
6. **Score overflow**: Use regular JavaScript numbers (safe up to ~9 quadrillion). Unlikely to overflow in single session.
7. **Window resize during gameplay**: Handle resize event to update camera aspect ratio and renderer size without disrupting game state.
8. **Multiple simultaneous inputs**: Debounce lane switch to prevent multiple triggers from same user action (click + touch firing together).
9. **Dropped frames**: Delta time capped to prevent physics instability on lag spikes (max delta = 0.1s recommended).
10. **Motorcycle spawning in wrong lane**: Default spawn to right lane consistently. Reset to right lane on restart.
11. **Coin collection during lane switch**: Use `getCurrentLane()` for collection detection, but may want to allow collection from either lane during mid-switch for generous gameplay feel (implementation decision during testing).
12. **Camera positioning clarity**: Camera must be behind motorcycle (+Z position) looking toward -Z to see road ahead. Ensure camera never flips or loses track of forward direction.
13. **Background wrap-around in Z**: Buildings and scenery must wrap seamlessly as they scroll past camera. Ensure spawn distance is far enough that wrap is invisible.
14. **Ground plane vs lane markings**: Ground plane itself stays static, only lane marking strips scroll. Ensure visual clarity between static road surface and moving markings.

## Testing Strategy

### Unit Testing Approach
- Test factories create correct geometry
- Test animator state transitions
- Test controller lane switching logic on X-axis
- Test `getCurrentLane()` returns correct lane state
- Test object pool acquire/release cycles
- Test collision detection with known positions
- Test powerup collection detection
- Test Z-axis movement for obstacles and powerups

### Integration Testing Approach
- Test Game state machine transitions
- Test input routing through InputManager to controller
- Test obstacle spawn at -Z, move to +Z, despawn lifecycle
- Test powerup spawn at -Z, collection, despawn lifecycle
- Test scoring based on passed obstacles
- Test scoring based on collected coins
- Test reset functionality restores initial state
- Test camera positioning relative to motorcycle

### Manual Testing Checklist
- Menu displays on load
- Click/tap/spacebar starts game
- Motorcycle drops in smoothly
- Lane switching works on X-axis with all input types
- Obstacles spawn far ahead (-Z) and approach camera (+Z)
- Obstacles positioned correctly in lanes (X-axis)
- Coins spawn far ahead (-Z) and approach camera (+Z)
- Collision detection works in both lanes
- Coin collection works in both lanes
- Coin collection increments score correctly
- Death animation plays fully
- Game over screen displays final score
- Restart works cleanly
- Score increments for each passed obstacle
- Score increments for each collected coin
- Background buildings on sides of road scroll in +Z direction
- Lane markings scroll in +Z direction while ground stays static
- Coins rotate visibly
- Camera provides good view of road ahead
- No visual glitches or popping
- Performance is smooth (60fps target)

### Performance Testing
- Monitor FPS during extended gameplay
- Check for memory leaks (object pool should prevent)
- Verify object pool stats show proper reuse
- Test on lower-end devices if mobile support desired

## Rollback Considerations

### Phase-by-phase Rollback
Each phase is independent enough to revert individually:
- Phases 1-3: Safe to restart from scratch if infrastructure is wrong
- Phases 4-6: Can iterate on motorcycle design without affecting other systems
- Phases 7-9: Can adjust obstacles independently of other systems
- Phase 9.5: Powerups can be disabled or simplified without breaking core gameplay
- Phases 10-11: Background/ground purely visual, no gameplay impact
- Phase 12: Input system isolated, can change mapping
- Phase 13: UI purely presentational
- Phases 14-15: Game state machine integration point, test thoroughly before proceeding

### Critical Checkpoints
- After Phase 6: Motorcycle controller working with basic X-axis lane switching and `getCurrentLane()` method
- After Phase 9: Full obstacle system functional with lane-based collision detection and Z-axis movement
- After Phase 9.5: Powerup collection system functional with Z-axis movement
- After Phase 14: Complete game loop playable end-to-end with correct camera positioning

### Fallback Strategies
- If lane switching feels bad, can fall back to simpler instant switch without interpolation
- If three obstacle types are too complex initially, start with just cars
- If coins are problematic, can defer to post-MVP and focus on obstacle avoidance only
- If parallax background is problematic, can use simple gradient sky as fallback
- If voxel style is too complex, can simplify geometry to basic primitives
- If chase camera angle is difficult, can adjust camera position/angle for better visibility

### Version Control Strategy
- Commit after each phase completion
- Tag working states: "phase-6-controller-working", "phase-9-obstacles-working", "phase-9.5-powerups-working", "phase-14-playable"
- Keep main branch stable, use feature branches for experimental changes

## Dependencies and Prerequisites

### Required Knowledge
- Three.js fundamentals (scene, camera, renderer, geometry, materials)
- TypeScript interfaces and generics
- State machine pattern
- Event emitter pattern
- Object pooling pattern
- 3D coordinate systems and transformations

### External Dependencies
- `three@^0.182.0`: Core 3D library
- `typescript@^5.9.3`: Type checking and compilation
- `vite@^7.3.0`: Build tool and dev server
- `@types/three@^0.182.0`: TypeScript definitions for Three.js

### Development Environment
- Node.js 18+ recommended
- Modern browser with WebGL support
- VS Code or similar TypeScript-aware editor recommended

## Timeline Estimate

- Phase 1: 1 hour (project setup)
- Phase 2: 30 minutes (config files with correct coordinates)
- Phase 3: 1 hour (base interfaces)
- Phase 4: 2 hours (motorcycle factory facing -Z)
- Phase 5: 1.5 hours (motorcycle animator with Z-axis wheel rotation)
- Phase 6: 2.5 hours (motorcycle controller with X-axis lane switching and getCurrentLane())
- Phase 7: 2 hours (obstacle factory facing -Z)
- Phase 8: 1 hour (powerup/scenery)
- Phase 9: 2 hours (obstacle manager with Z-axis movement)
- Phase 9.5: 1.5 hours (powerup manager with Z-axis movement)
- Phase 10: 2 hours (background with X-axis positioning, Z-axis scrolling)
- Phase 11: 1 hour (static ground with scrolling markings)
- Phase 12: 30 minutes (input system)
- Phase 13: 1 hour (UI)
- Phase 14: 2 hours (game state machine with chase camera)
- Phase 15: 30 minutes (main entry)
- Phase 16: 2 hours (polish)

**Total: ~23.5 hours** (estimated for experienced developer familiar with Three.js)

## Success Criteria

The implementation is complete when:
1. ✓ `npm run dev` starts without errors
2. ✓ `npm run build` produces production build without errors
3. ✓ Menu screen displays on load
4. ✓ Click/tap/spacebar starts game
5. ✓ Motorcycle drops in from above
6. ✓ Lane switching works smoothly on X-axis with any input
7. ✓ Obstacles spawn far ahead (-Z) and approach in +Z direction
8. ✓ Obstacles positioned correctly in lanes (X-axis)
9. ✓ Coins spawn far ahead (-Z) and approach in +Z direction
10. ✓ Coin collection increments score
11. ✓ Collision with obstacles triggers death animation
12. ✓ Score increments for each obstacle passed
13. ✓ Score increments for each coin collected
14. ✓ Death animation completes and shows game over screen
15. ✓ Game over displays final score (obstacles + coins)
16. ✓ Restart works cleanly
17. ✓ Background buildings on sides scroll in +Z direction
18. ✓ Lane markings scroll in +Z direction while ground plane stays static
19. ✓ Coins rotate visibly during gameplay
20. ✓ Camera positioned behind motorcycle provides clear view ahead
21. ✓ Voxel art style is consistent
22. ✓ Game runs at 60fps on target hardware
23. ✓ No console errors during gameplay
